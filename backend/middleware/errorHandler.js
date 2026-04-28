import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const details = err.details || undefined;

  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    message: err.message,
  });

  res.status(statusCode).json({
    error: {
      code,
      message: err.message || 'Internal server error',
      ...(details ? { details } : {}),
    },
  });
};

export const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('HTTP request', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    });
  });

  next();
};
