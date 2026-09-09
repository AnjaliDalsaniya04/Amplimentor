'use strict';

function notFound(req, res, next) {
  res.status(404).json({ message: 'Route not found.' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Server error.';
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };