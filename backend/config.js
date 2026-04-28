const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitCsv = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const backendEnv = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  corsOrigins: splitCsv(process.env.BACKEND_CORS_ORIGINS || '*'),
  rateLimitWindowMs: toNumber(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 10_000),
  rateLimitMaxMessages: toNumber(process.env.CHAT_RATE_LIMIT_MAX_MESSAGES, 8),
});
