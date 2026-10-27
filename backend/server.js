const path = require('path');
const dotenv = require('dotenv');

// 1) CATCH UNCAUGHT SYNCHRONOUS EXCEPTIONS (Must be at the very top before any other code)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down server...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// 2) LOAD ENVIRONMENT CONFIGURATION
dotenv.config({ path: path.join(__dirname, 'config.env') });

const mongoose = require('mongoose');
const app = require('./app');

// 3) CONNECT TO MONGODB DATABASE
const DB = process.env.DATABASE || 'mongodb://127.0.0.1:27017/apexmart';

mongoose
  .connect(DB)
  .then((con) => {
    console.log(
      `✅ MongoDB Connected Successfully: Host [${con.connection.host}], DB [${con.connection.name}]`
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.warn(
      '⚠️  Ensure MongoDB service is running locally on mongodb://127.0.0.1:27017 or update DATABASE in config.env'
    );
  });

// 4) START EXPRESS SERVER
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(
    `🚀 ApexMart API Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode...`
  );
  console.log(`📡 Health Check: http://localhost:${port}/api/v1/health`);
});

// 5) HANDLE UNHANDLED ASYNCHRONOUS PROMISE REJECTIONS
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// 6) HANDLE SIGTERM SIGNAL (e.g. from Heroku/Docker/Kubernetes)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

module.exports = server;
