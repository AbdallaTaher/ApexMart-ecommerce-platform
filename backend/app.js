const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const latencyBudgetMiddleware = require('./utils/latencyBudget');
const { globalApiLimiter } = require('./utils/rateLimiters');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderController = require('./controllers/orderController');

const app = express();

// Trust reverse proxy (Render, Heroku, Cloudflare) for HTTPS detection and secure cookies
app.set('trust proxy', 1);

// 1) GLOBAL MIDDLEWARES

// Latency budget & high-resolution performance monitoring (<300ms budget)
app.use(latencyBudgetMiddleware());

// Response payload compression (Gzip/Brotli)
app.use(compression());

// Set security HTTP headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Development request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS Configuration with credentials support for HttpOnly cookies
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://web.postman.co',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, or Postman desktop)
      if (!origin) return callback(null, true);

      // In development mode, allow any localhost/127.0.0.1 port and Postman tools
      if (process.env.NODE_ENV === 'development') {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        const isPostman = origin.includes('postman.co') || origin.includes('postman');
        if (isLocalhost || isPostman || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      // In production mode, check allowedOrigins whitelist, CLIENT_URL, and *.vercel.app domains
      const isAllowedOrigin =
        allowedOrigins.includes(origin) ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
        /\.vercel\.app$/.test(origin);

      if (isAllowedOrigin) {
        callback(null, true);
      } else {
        callback(new AppError('CORS policy: Not allowed by Access-Control-Allow-Origin', 403));
      }
    },
    credentials: true,
  })
);

// Stripe Webhook Endpoint (MUST be mounted before express.json() to preserve raw Buffer body for HMAC signature verification)
app.post(
  '/api/v1/orders/webhook-checkout',
  express.raw({ type: 'application/json' }),
  orderController.webhookCheckout
);

// Body parser, reading data from body into req.body (with strict 10kb limit to prevent payload attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser for reading secure HttpOnly authentication cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection (strips operators like $gt, $ne, etc.)
app.use(mongoSanitize());

// Request timestamp & URL sanitization middleware (strips accidental copy-pasted trailing newlines %0A, %0D, and whitespace)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  if (req.url) {
    req.url = req.url.replace(/(%0A|%0D|\r|\n)+$/i, '').trim();
  }
  if (req.originalUrl) {
    req.originalUrl = req.originalUrl.replace(/(%0A|%0D|\r|\n)+$/i, '').trim();
  }
  next();
});

// Tiered rate limiter for all /api endpoints
app.use('/api', globalApiLimiter);

// 2) BASE & HEALTH CHECK ROUTES
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ApexMart E-Commerce API is running smoothly',
    environment: process.env.NODE_ENV,
    timestamp: req.requestTime,
  });
});

// 3) MOUNT API FEATURE ROUTERS
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/admin', adminRoutes);

// 4) UNHANDLED ROUTES CATCH-ALL
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4) GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
