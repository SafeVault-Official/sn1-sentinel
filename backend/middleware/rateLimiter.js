import { REQUEST_RATE_LIMIT } from '../config/constants.js';
import { createRateLimiter } from '../services/rateLimitService.js';

const requestRateLimiter = createRateLimiter({
  windowMs: REQUEST_RATE_LIMIT.windowMs,
  maxEvents: REQUEST_RATE_LIMIT.maxRequests,
});

export const httpRateLimiter = (req, res, next) => {
  const key = req.ip || 'unknown';
  if (!requestRateLimiter.isLimited(key)) {
    next();
    return;
  }

  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  });
};
