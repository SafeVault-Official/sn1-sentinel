export const WALLET_TYPES = {
  METAMASK: 'metamask',
  COINBASE: 'coinbase',
  WALLETCONNECT: 'walletconnect',
  TRUST: 'trust',
  PHANTOM: 'phantom',
};

export const WALLET_OPTIONS = [
  { id: WALLET_TYPES.METAMASK, label: 'MetaMask', family: 'evm' },
  { id: WALLET_TYPES.COINBASE, label: 'Coinbase Wallet', family: 'evm' },
  { id: WALLET_TYPES.WALLETCONNECT, label: 'WalletConnect', family: 'bridge' },
  { id: WALLET_TYPES.TRUST, label: 'Trust Wallet', family: 'bridge' },
  { id: WALLET_TYPES.PHANTOM, label: 'Phantom', family: 'solana' },
];

const resolveInjectedProviders = () => {
  if (!window?.ethereum) return [];
  return window.ethereum.providers || [window.ethereum];
};

const createMockAccount = (prefix = '0x') => `${prefix}${crypto.randomUUID().replaceAll('-', '').slice(0, 40)}`;

const attachEvmListeners = (provider, handlers) => {
  provider?.on?.('accountsChanged', handlers.onAccountsChanged);
  provider?.on?.('chainChanged', handlers.onChainChanged);
  return () => {
    provider?.removeListener?.('accountsChanged', handlers.onAccountsChanged);
    provider?.removeListener?.('chainChanged', handlers.onChainChanged);
  };
};

export const walletAdapters = {
  metamask: {
    detect: () => resolveInjectedProviders().some((p) => p.isMetaMask && !p.isCoinbaseWallet),
    async connect() {
      const provider = resolveInjectedProviders().find((p) => p.isMetaMask && !p.isCoinbaseWallet);
      if (!provider) throw new Error('MetaMask provider not found.');
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });
      return { provider, address: accounts[0], chainId };
    },
    watch(provider, handlers) {
      return attachEvmListeners(provider, handlers);
    },
    disconnect: async () => undefined,
  },
  coinbase: {
    detect: () => resolveInjectedProviders().some((p) => p.isCoinbaseWallet),
    async connect() {
      const provider = resolveInjectedProviders().find((p) => p.isCoinbaseWallet);
      if (!provider) throw new Error('Coinbase provider not found.');
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });
      return { provider, address: accounts[0], chainId };
    },
    watch(provider, handlers) {
      return attachEvmListeners(provider, handlers);
    },
    disconnect: async () => undefined,
  },
  walletconnect: {
    detect: () => true,
    async connect() {
      return {
        provider: { mode: 'walletconnect-mock' },
        address: createMockAccount('0xwc'),
        chainId: '0x1',
      };
    },
    watch() {
      return () => undefined;
    },
    disconnect: async () => undefined,
  },
  trust: {
    detect: () => true,
    async connect() {
      return {
        provider: { mode: 'trust-via-walletconnect-mock' },
        address: createMockAccount('0xtr'),
        chainId: '0x1',
      };
    },
    watch() {
      return () => undefined;
    },
    disconnect: async () => undefined,
  },
  phantom: {
    detect: () => Boolean(window?.phantom?.solana?.isPhantom),
    async connect() {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) {
        return {
          provider: { mode: 'phantom-mock' },
          address: createMockAccount('SoL'),
          chainId: 'solana:mainnet-beta',
          walletFamily: 'solana',
        };
      }

      const response = await provider.connect();
      return {
        provider,
        address: response.publicKey.toString(),
        chainId: 'solana:mainnet-beta',
        walletFamily: 'solana',
      };
    },
    watch(provider, handlers) {
      provider?.on?.('accountChanged', (publicKey) => {
        handlers.onAccountsChanged([publicKey?.toString() || '']);
      });
      provider?.on?.('disconnect', () => handlers.onAccountsChanged([]));
      return () => {
        provider?.removeAllListeners?.('accountChanged');
      };
    },
    disconnect: async (provider) => {
      await provider?.disconnect?.();
    },
  },
};
