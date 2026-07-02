// ============================================================
// middleware/errorHandler.js
// Catches errors that bubble up from routes/controllers that
// didn't handle them explicitly, plus a 404 handler for
// unmatched routes. Keeps error formatting consistent.
// ============================================================

// Handles requests to routes that don't exist
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

// Catches any error passed to next(err) or thrown synchronously
// in a route that wasn't already caught by a try/catch.
const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler caught:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = { notFoundHandler, globalErrorHandler };
