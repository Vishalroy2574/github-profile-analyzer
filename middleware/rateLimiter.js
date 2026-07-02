// ============================================================
// middleware/rateLimiter.js
// Limits how many requests a single IP can make in a given
// time window, to protect the API and the GitHub rate limit
// it depends on from being exhausted by abuse.
// ============================================================

const rateLimit = require('express-rate-limit');
require('dotenv').config();

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // limit each IP to 100 requests per window
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  }
});

module.exports = apiLimiter;
