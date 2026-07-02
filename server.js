require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { testConnection } = require('./config/db');
const githubRoutes = require('./routes/githubRoutes');
const apiLimiter = require('./middleware/rateLimiter');
const {
  notFoundHandler,
  globalErrorHandler,
} = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter
app.use('/api', apiLimiter);

// ---------------- Health Route ----------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// ---------------- Root Route ----------------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    health: '/health',
    api: '/api/github',
  });
});

// ---------------- GitHub Routes ----------------
app.use('/api/github', githubRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();

module.exports = app;