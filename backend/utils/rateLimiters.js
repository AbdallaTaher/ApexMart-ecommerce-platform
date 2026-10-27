const rateLimit = require('express-rate-limit');
const AppError = require('./appError');

/**
 * Enterprise Tiered Rate Limiting Configuration (Security Module 03)
 * Protects public catalog, search, and authentication endpoints from abuse, DoS, and automated scraping.
 */

// 1) Global API Rate Limiter (Protects entire /api surface)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 5000,
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(
      new AppError(
        'Too many requests from this IP address. Please try again in 15 minutes.',
        429
      )
    );
  },
});

// 2) Catalog & Search Rate Limiter (Public Discovery & Live Auto-Search)
// Allows smooth real-time debounced typing while throttling scraping spiders
const catalogSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'production' ? 180 : 3000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Too many catalog search requests from this IP. Please slow down and try again shortly.',
        429
      )
    );
  },
});

// 3) Strict Authentication Rate Limiter (Brute-Force & Credential Stuffing Defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 15 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Too many authentication attempts from this IP. Please try again after 15 minutes.',
        429
      )
    );
  },
});

// 4) Transactional Checkout & Order Rate Limiter (Card Testing & Spam Defense)
const orderCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'production' ? 30 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Too many checkout attempts from this IP address. Please try again in 15 minutes.',
        429
      )
    );
  },
});

module.exports = {
  globalApiLimiter,
  catalogSearchLimiter,
  authLimiter,
  orderCheckoutLimiter,
};
