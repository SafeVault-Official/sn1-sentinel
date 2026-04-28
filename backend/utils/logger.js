const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const configuredLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
const currentLevel = LEVELS[configuredLevel] ?? LEVELS.info;

const formatLog = (level, message, context = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  return JSON.stringify(payload);
};

const shouldLog = (level) => LEVELS[level] <= currentLevel;

const output = (level, message, context) => {
  if (!shouldLog(level)) return;
  const line = formatLog(level, message, context);
  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
};

export const logger = {
  error: (message, context) => output('error', message, context),
  warn: (message, context) => output('warn', message, context),
  info: (message, context) => output('info', message, context),
  debug: (message, context) => output('debug', message, context),
};
