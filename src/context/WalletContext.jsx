import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import UniversalProvider from '@walletconnect/universal-provider';
import { blockchainService } from '../services/web3/blockchainService';
import { appEnv } from '../config/env';

const WalletContext = createContext(null);

const WALLETCONNECT_PROJECT_ID = appEnv.walletConnectProjectId;

const WC_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
];

const SUPPORTED_WALLETS = [
  { id: 'metamask', label: 'MetaMask', mode: 'injected' },
  { id: 'walletconnect', label: 'WalletConnect', mode: 'walletconnect' },
  { id: 'coinbase', label: 'Coinbase Wallet', mode: 'injected' },
  { id: 'trust', label: 'Trust Wallet', mode: 'walletconnect' },
];

const NETWORK_LABELS = {
  '0x1': 'Ethereum Mainnet',
  '0xaa36a7': 'Sepolia',
  '0x89': 'Polygon',
  '0x13881': 'Polygon Mumbai',
};

const resolveInjectedProvider = (walletType) => {
  if (!window?.ethereum) return null;

  const providers = window.ethereum.providers || [window.ethereum];

  if (walletType === 'metamask') {
    return providers.find((p) => p.isMetaMask && !p.isCoinbaseWallet) || null;
  }

  if (walletType === 'coinbase') {
    return providers.find((p) => p.isCoinbaseWallet) || null;
  }

  return null;
};

const normalizeWalletAddress = (wallet = '') => {
  if (!wallet) return '';
  const parts = wallet.split(':');
  return parts[parts.length - 1];
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [chainId, setChainId] = useState('');
  const [networkName, setNetworkName] = useState('Unknown network');
  const [walletConnectUri, setWalletConnectUri] = useState('');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balances, setBalances] = useState({ usdBalance: 0, snl1Balance: 0 });

  const activeProviderRef = useRef(null);
  const activeCleanupRef = useRef(() => undefined);

  const clearConnection = useCallback(() => {
    activeCleanupRef.current?.();
    activeCleanupRef.current = () => undefined;
    activeProviderRef.current = null;

    setWalletAddress('');
    setWalletType('');
    setIsConnected(false);
    setConnectionState('disconnected');
    setChainId('');
    setNetworkName('Unknown network');
    setWalletConnectUri('');
  }, []);

  const bindProviderEvents = useCallback((provider, nextWalletType) => {
    const handleAccountsChanged = (accounts = []) => {
      const nextAddress = normalizeWalletAddress(accounts[0] || '');

      if (!nextAddress) {
        clearConnection();
        return;
      }

      setWalletAddress(nextAddress);
      setWalletType(nextWalletType);
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleChainChanged = (nextChainId) => {
      const normalized =
        typeof nextChainId === 'number'
          ? `0x${nextChainId.toString(16)}`
          : nextChainId;

      setChainId(normalized || '');
      setNetworkName(NETWORK_LABELS[normalized] || `Chain ${normalized || 'unknown'}`);
    };

    if (provider?.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    }

    activeCleanupRef.current = () => {
      if (provider?.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [clearConnection]);

  const connectInjectedWallet = useCallback(async (nextWalletType) => {
    const provider = resolveInjectedProvider(nextWalletType);

    if (!provider) {
      throw new Error(`${nextWalletType === 'coinbase' ? 'Coinbase Wallet' : 'MetaMask'} not detected.`);
    }

    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const nextChainId = await provider.request({ method: 'eth_chainId' });

    if (!accounts.length) {
      throw new Error('Wallet connection denied.');
    }

    activeCleanupRef.current?.();
    activeProviderRef.current = provider;

    bindProviderEvents(provider, nextWalletType);

    setWalletAddress(accounts[0]);
    setWalletType(nextWalletType);
    setIsConnected(true);
    setConnectionState('connected');
    setChainId(nextChainId);
    setNetworkName(NETWORK_LABELS[nextChainId] || `Chain ${nextChainId}`);
  }, [bindProviderEvents]);

  const connectWalletConnect = useCallback(async (nextWalletType) => {
    const provider = await UniversalProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: appEnv.walletConnectName,
        description: appEnv.walletConnectDescription,
        url: window.location.origin,
        icons: [appEnv.walletConnectIcon],
      },
    });

    provider.on('display_uri', (uri) => setWalletConnectUri(uri));

    await provider.connect({
      namespaces: {
        eip155: {
          methods: WC_METHODS,
          chains: appEnv.walletConnectChains,
          events: ['chainChanged', 'accountsChanged'],
          rpcMap: appEnv.walletConnectRpcMap,
        },
      },
    });

    const accounts = await provider.request({ method: 'eth_accounts' });
    const nextChainId = await provider.request({ method: 'eth_chainId' });

    if (!accounts.length) {
      throw new Error('No account returned.');
    }

    activeCleanupRef.current?.();
    activeProviderRef.current = provider;

    bindProviderEvents(provider, nextWalletType);

    setWalletAddress(normalizeWalletAddress(accounts[0]));
    setWalletType(nextWalletType);
    setIsConnected(true);
    setConnectionState('connected');
    setChainId(nextChainId);
    setNetworkName(NETWORK_LABELS[nextChainId] || `Chain ${nextChainId}`);
    setWalletConnectUri('');
  }, [bindProviderEvents]);

  const connectWallet = useCallback(async (type) => {
    setConnectionState('connecting');

    try {
      if (type === 'metamask' || type === 'coinbase') {
        await connectInjectedWallet(type);
      } else if (type === 'walletconnect' || type === 'trust') {
        await connectWalletConnect(type);
      } else {
        throw new Error('Unsupported wallet');
      }
    } catch (err) {
      setConnectionState('error');
      throw err;
    }
  }, [connectInjectedWallet, connectWalletConnect]);

  const disconnectWallet = useCallback(async () => {
    const provider = activeProviderRef.current;

    if (walletType === 'walletconnect' || walletType === 'trust') {
      try {
        await provider?.disconnect?.();
      } catch {}
    }

    clearConnection();
  }, [clearConnection, walletType]);

  useEffect(() => {
    if (!walletAddress) {
      setBalances({ usdBalance: 0, snl1Balance: 0 });
      return;
    }

    let active = true;
    setIsLoadingBalance(true);

    blockchainService.getBalance(walletAddress)
      .then((data) => active && setBalances(data))
      .finally(() => active && setIsLoadingBalance(false));

    return () => { active = false; };
  }, [walletAddress]);

  const value = useMemo(() => ({
    walletAddress,
    walletType,
    isConnected,
    connectionState,
    chainId,
    networkName,
    walletConnectUri,
    supportedWallets: SUPPORTED_WALLETS,
    isLoadingBalance,
    balances,
    connectWallet,
    disconnectWallet,
  }), [
    walletAddress,
    walletType,
    isConnected,
    connectionState,
    chainId,
    networkName,
    walletConnectUri,
    isLoadingBalance,
    balances,
    connectWallet,
    disconnectWallet,
  ]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider.');
  return ctx;
};