const splitCsv = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const appEnv = Object.freeze({
  mode: import.meta.env.MODE,
  chatApiUrl: import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000',
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  walletConnectName: import.meta.env.VITE_WALLETCONNECT_APP_NAME || 'SNL1 Sentinel',
  walletConnectDescription: import.meta.env.VITE_WALLETCONNECT_APP_DESCRIPTION || 'SNL1 multi-wallet launchpad',
  walletConnectIcon: import.meta.env.VITE_WALLETCONNECT_APP_ICON || 'https://walletconnect.com/walletconnect-logo.png',
  walletConnectChains: splitCsv(import.meta.env.VITE_WALLETCONNECT_CHAINS || 'eip155:1'),
  walletConnectRpcMap: Object.freeze({
    1: import.meta.env.VITE_WALLETCONNECT_RPC_ETHEREUM || 'https://cloudflare-eth.com',
  }),
  tokenFactoryAddress:
    import.meta.env.VITE_TOKEN_FACTORY_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  chatRateLimitWindowMs: toNumber(import.meta.env.VITE_CHAT_RATE_LIMIT_WINDOW_MS, 10_000),
  chatRateLimitMaxMessages: toNumber(import.meta.env.VITE_CHAT_RATE_LIMIT_MAX_MESSAGES, 8),
});
