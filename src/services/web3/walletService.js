/**
 * Unified wallet abstraction layer.
 *
 * This service intentionally centralizes wallet behavior behind a stable API so the
 * UI and feature modules do not need to care about provider-specific details.
 * Future production integrations (real WalletConnect SDK, chain-specific providers,
 * deeper network validation) can be added behind this same interface.
 */

export const WALLET_TYPES = {
  PHANTOM: 'phantom',
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
};

const NETWORKS = {
  EVM_MAINNET: 'eip155:1',
  SOLANA_MAINNET: 'solana:mainnet-beta',
};

const ERROR_CODES = {
  WALLET_NOT_INSTALLED: 'WALLET_NOT_INSTALLED',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  WALLET_DISCONNECTED: 'WALLET_DISCONNECTED',
  UNKNOWN: 'UNKNOWN',
};

const SUPPORTED_NETWORKS = {
  [WALLET_TYPES.METAMASK]: [NETWORKS.EVM_MAINNET],
  [WALLET_TYPES.WALLETCONNECT]: [NETWORKS.EVM_MAINNET],
  [WALLET_TYPES.PHANTOM]: [NETWORKS.SOLANA_MAINNET],
};

const normalizeChainId = (chainId = '') => {
  if (!chainId) return NETWORKS.EVM_MAINNET;
  if (String(chainId).startsWith('eip155:')) return String(chainId);
  if (String(chainId).startsWith('0x')) return `eip155:${Number.parseInt(chainId, 16)}`;
  if (!Number.isNaN(Number(chainId))) return `eip155:${Number(chainId)}`;
  return String(chainId);
};

const toWalletState = ({ address = '', type = '', network = '', connected = false } = {}) => ({
  address,
  type,
  network,
  connected,
});

const detectWalletType = () => {
  if (window?.phantom?.solana?.isPhantom) return WALLET_TYPES.PHANTOM;

  const injected = window?.ethereum?.providers || (window?.ethereum ? [window.ethereum] : []);
  if (injected.some((provider) => provider?.isMetaMask && !provider?.isCoinbaseWallet)) {
    return WALLET_TYPES.METAMASK;
  }

  // WalletConnect-compatible fallback adapter (mock-first).
  return WALLET_TYPES.WALLETCONNECT;
};

const getMetaMaskProvider = () => {
  const providers = window?.ethereum?.providers || (window?.ethereum ? [window.ethereum] : []);
  return providers.find((provider) => provider?.isMetaMask && !provider?.isCoinbaseWallet) || null;
};

const mapWalletError = (error, fallbackMessage) => {
  if (error?.code === 4001) {
    return { code: ERROR_CODES.USER_REJECTED, message: 'User rejected wallet connection request.' };
  }

  if (error?.message?.toLowerCase()?.includes('network')) {
    return { code: ERROR_CODES.NETWORK_MISMATCH, message: error.message };
  }

  if (error?.message?.toLowerCase()?.includes('disconnect')) {
    return { code: ERROR_CODES.WALLET_DISCONNECTED, message: error.message };
  }

  if (error?.message?.toLowerCase()?.includes('not installed') || error?.message?.toLowerCase()?.includes('not found')) {
    return { code: ERROR_CODES.WALLET_NOT_INSTALLED, message: error.message };
  }

  return { code: ERROR_CODES.UNKNOWN, message: fallbackMessage || error?.message || 'Wallet operation failed.' };
};

const createWalletConnectMock = () => {
  const state = {
    address: `0xwc${crypto.randomUUID().replaceAll('-', '').slice(0, 38)}`,
    chainId: NETWORKS.EVM_MAINNET,
  };

  return {
    async connect() {
      return { ...state };
    },
    async disconnect() {
      return true;
    },
    on() {
      return undefined;
    },
    removeListener() {
      return undefined;
    },
  };
};

class WalletService {
  constructor() {
    this.provider = null;
    this.wallet = toWalletState();
    this.unsubscribe = () => undefined;
    this.sessionListeners = new Set();
  }

  subscribe(listener) {
    this.sessionListeners.add(listener);
    return () => this.sessionListeners.delete(listener);
  }

  emitSessionChange() {
    const snapshot = this.getWalletSnapshot();
    this.sessionListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.warn('walletService session listener failed:', error);
      }
    });
  }

  getSupportedWalletTypes() {
    return Object.values(WALLET_TYPES);
  }

  getWalletType() {
    return this.wallet.type;
  }

  getWalletAddress() {
    return this.wallet.address;
  }

  getNetwork() {
    return this.wallet.network;
  }

  getWalletSnapshot() {
    return { ...this.wallet };
  }

  getNetworkStatus() {
    const expectedNetworks = SUPPORTED_NETWORKS[this.wallet.type] || [];
    if (!this.wallet.connected) {
      return { ok: false, expectedNetworks, actualNetwork: '', reason: 'Wallet not connected.' };
    }

    if (!expectedNetworks.length || expectedNetworks.includes(this.wallet.network)) {
      return { ok: true, expectedNetworks, actualNetwork: this.wallet.network, reason: '' };
    }

    return {
      ok: false,
      expectedNetworks,
      actualNetwork: this.wallet.network,
      reason: `Network mismatch. Expected ${expectedNetworks.join(', ')}, got ${this.wallet.network}.`,
    };
  }

  async connectWallet(preferredType) {
    const walletType = preferredType || detectWalletType();

    try {
      if (walletType === WALLET_TYPES.PHANTOM) {
        const provider = window?.phantom?.solana;
        if (!provider?.isPhantom) {
          throw new Error('Phantom wallet not installed.');
        }

        const response = await provider.connect();
        const address = response?.publicKey?.toString?.() || '';
        this.provider = provider;
        this.wallet = toWalletState({
          address,
          type: WALLET_TYPES.PHANTOM,
          network: NETWORKS.SOLANA_MAINNET,
          connected: Boolean(address),
        });
        this.bindProviderEvents(WALLET_TYPES.PHANTOM);
        this.emitSessionChange();
        return this.getWalletSnapshot();
      }

      if (walletType === WALLET_TYPES.METAMASK) {
        const provider = getMetaMaskProvider();
        if (!provider) {
          throw new Error('MetaMask wallet not installed.');
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const chainId = await provider.request({ method: 'eth_chainId' });

        this.provider = provider;
        this.wallet = toWalletState({
          address: accounts?.[0] || '',
          type: WALLET_TYPES.METAMASK,
          network: normalizeChainId(chainId),
          connected: Boolean(accounts?.length),
        });
        this.bindProviderEvents(WALLET_TYPES.METAMASK);
        this.emitSessionChange();
        return this.getWalletSnapshot();
      }

      const wcProvider = createWalletConnectMock();
      const session = await wcProvider.connect();

      this.provider = wcProvider;
      this.wallet = toWalletState({
        address: session.address,
        type: WALLET_TYPES.WALLETCONNECT,
        network: session.chainId,
        connected: true,
      });
      this.emitSessionChange();
      return this.getWalletSnapshot();
    } catch (error) {
      throw mapWalletError(error, 'Unable to connect wallet.');
    }
  }

  async disconnectWallet() {
    try {
      await this.provider?.disconnect?.();
      this.unsubscribe?.();
      this.provider = null;
      this.wallet = toWalletState();
      this.emitSessionChange();
      return this.getWalletSnapshot();
    } catch (error) {
      throw mapWalletError(error, 'Unable to disconnect wallet.');
    }
  }

  bindProviderEvents(walletType) {
    this.unsubscribe?.();

    if (!this.provider?.on) {
      this.unsubscribe = () => undefined;
      return;
    }

    if (walletType === WALLET_TYPES.PHANTOM) {
      const onAccountChanged = (publicKey) => {
        const address = publicKey?.toString?.() || '';
        this.wallet = toWalletState({
          address,
          type: WALLET_TYPES.PHANTOM,
          network: NETWORKS.SOLANA_MAINNET,
          connected: Boolean(address),
        });
        this.emitSessionChange();
      };

      this.provider.on('accountChanged', onAccountChanged);
      this.unsubscribe = () => this.provider?.removeListener?.('accountChanged', onAccountChanged);
      return;
    }

    const onAccountsChanged = (accounts = []) => {
      const address = accounts?.[0] || '';
      if (!address) {
        this.wallet = toWalletState();
        this.emitSessionChange();
        return;
      }

      this.wallet = toWalletState({
        ...this.wallet,
        address,
        connected: Boolean(address),
      });
      this.emitSessionChange();
    };

    const onChainChanged = (nextChainId) => {
      this.wallet = toWalletState({
        ...this.wallet,
        network: normalizeChainId(nextChainId),
      });
      this.emitSessionChange();
    };

    this.provider.on('accountsChanged', onAccountsChanged);
    this.provider.on('chainChanged', onChainChanged);

    this.unsubscribe = () => {
      this.provider?.removeListener?.('accountsChanged', onAccountsChanged);
      this.provider?.removeListener?.('chainChanged', onChainChanged);
    };
  }
}

export const walletService = new WalletService();
export { ERROR_CODES as WALLET_ERROR_CODES, NETWORKS as WEB3_NETWORKS };
