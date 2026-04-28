export const createRateLimiter = ({ windowMs, maxEvents }) => {
  const counters = new Map();

  const isLimited = (key) => {
    const now = Date.now();
    const recent = (counters.get(key) || []).filter((time) => now - time < windowMs);
    recent.push(now);
    counters.set(key, recent);
    return recent.length > maxEvents;
  };

  return {
    isLimited,
  };
};
