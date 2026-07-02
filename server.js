// ============================================================
// server.js
// Application entry point. Sets up Express, middleware,
// routes, and starts the HTTP server.
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { testConnection } = require('./config/db');
const githubRoutes = require('./routes/githubRoutes');
const apiLimiter = require('./middleware/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------- Security & utility middleware ----------------
app.use(helmet());          // sets various security-related HTTP headers
app.use(cors());            // enables Cross-Origin Resource Sharing
app.use(compression());     // gzip-compresses responses
app.use(morgan('dev'));     // logs incoming requests to the console
app.use(express.json());    // parses incoming JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// ---------------- Routes ----------------

// Health check endpoint — useful for uptime monitoring / load balancers
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Simple root endpoint with basic API info
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    documentation: '/api/github',
    health: '/health'
  });
});

// Main API routes
app.use('/api/github', githubRoutes);

// ---------------- Error handling (must be last) ----------------
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ---------------- Start server ----------------
const startServer = async () => {
  await testConnection(); // verify DB connection before accepting traffic

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API base:     http://localhost:${PORT}/api/github`);
  });
};

startServer();

module.exports = app;
