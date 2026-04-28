export const PORT = Number(process.env.PORT) || 4000;

export const REQUEST_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 200,
};

export const SOCKET_CHAT_RATE_LIMIT = {
  windowMs: 10_000,
  maxMessages: 8,
};

export const MESSAGE_MAX_LENGTH = 400;

export const walletAddressRegex = /^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/;
