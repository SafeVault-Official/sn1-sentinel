import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { blockchainService } from '../src/services/web3/blockchainService';
import { walletService, WALLET_ERROR_CODES } from '../src/services/web3/walletService';

const WalletSessionContext = createContext(null);

const WALLET_OPTIONS = [
  { id: 'phantom', label: 'Phantom' },
  { id: 'metamask', label: 'MetaMask' },
  { id: 'walletconnect', label: 'WalletConnect' },
];

const initialState = {
  wallet: {
    address: '',
    type: '',
    network: '',
    connected: false,
  },
  balance: {
    usdBalance: 0,
    snl1Balance: 0,
  },
  transactionHistory: [],
  networkStatus: {
    ok: false,
    expectedNetworks: [],
    actualNetwork: '',
    reason: 'Wallet not connected.',
  },
  status: 'idle',
  error: null,
};

const toAvailabilityMap = () => ({
  phantom: Boolean(window?.phantom?.solana?.isPhantom),
  metamask: Boolean(window?.ethereum),
  walletconnect: true,
});

function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTING':
      return { ...state, status: 'connecting', error: null };
    case 'CONNECTED':
      return {
        ...state,
        wallet: action.payload.wallet,
        balance: action.payload.balance,
        transactionHistory: action.payload.transactionHistory,
        networkStatus: action.payload.networkStatus,
        status: 'connected',
        error: null,
      };
    case 'DISCONNECTED':
      return { ...initialState, status: 'idle' };
    case 'SYNC_CHAIN_STATE':
      return {
        ...state,
        wallet: action.payload.wallet,
        balance: action.payload.balance,
        transactionHistory: action.payload.transactionHistory,
        networkStatus: action.payload.networkStatus,
      };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    default:
      return state;
  }
}

export const WalletSessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const syncWalletChainState = useCallback(async () => {
    const wallet = walletService.getWalletSnapshot();

    if (!wallet.connected || !wallet.address) {
      dispatch({ type: 'DISCONNECTED' });
      return;
    }

    const [balance, transactionHistory] = await Promise.all([
      blockchainService.getBalance(wallet.address),
      blockchainService.getTransactionHistory(wallet.address),
    ]);

    dispatch({
      type: 'SYNC_CHAIN_STATE',
      payload: {
        wallet,
        balance,
        transactionHistory,
        networkStatus: walletService.getNetworkStatus(),
      },
    });
  }, []);

  const connect = useCallback(async (preferredType) => {
    dispatch({ type: 'CONNECTING' });

    try {
      const wallet = await walletService.connectWallet(preferredType);
      const [balance, transactionHistory] = await Promise.all([
        blockchainService.getBalance(wallet.address),
        blockchainService.getTransactionHistory(wallet.address),
      ]);

      dispatch({
        type: 'CONNECTED',
        payload: {
          wallet,
          balance,
          transactionHistory,
          networkStatus: walletService.getNetworkStatus(),
        },
      });
    } catch (error) {
      dispatch({
        type: 'ERROR',
        payload: {
          code: error?.code || WALLET_ERROR_CODES.UNKNOWN,
          message: error?.message || 'Wallet connection failed.',
        },
      });
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletService.disconnectWallet();
    } finally {
      dispatch({ type: 'DISCONNECTED' });
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    await syncWalletChainState();
  }, [syncWalletChainState]);

  const value = useMemo(() => ({
    session: {
      isConnected: state.wallet.connected,
      walletType: state.wallet.type,
      address: state.wallet.address,
      chainId: state.wallet.network,
      walletFamily: state.wallet.type === 'phantom' ? 'solana' : 'evm',
      balance: state.balance,
      status: state.status,
      error: state.error,
      networkStatus: state.networkStatus,
      transactions: state.transactionHistory,
    },
    connect,
    disconnect,
    refreshBalance,
    wallets: WALLET_OPTIONS,
    availability: toAvailabilityMap(),
    // Expose service-style API for feature modules that need a direct foundation layer.
    web3: {
      connectWallet: walletService.connectWallet.bind(walletService),
      disconnectWallet: walletService.disconnectWallet.bind(walletService),
      getWalletAddress: walletService.getWalletAddress.bind(walletService),
      getWalletType: walletService.getWalletType.bind(walletService),
      getNetwork: walletService.getNetwork.bind(walletService),
      getBalance: blockchainService.getBalance.bind(blockchainService),
      transferToken: blockchainService.transferToken.bind(blockchainService),
      createTransaction: blockchainService.createTransaction.bind(blockchainService),
      getTransactionHistory: blockchainService.getTransactionHistory.bind(blockchainService),
    },
  }), [state, connect, disconnect, refreshBalance]);

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
};

export const useWalletSession = () => {
  const context = useContext(WalletSessionContext);
  if (!context) throw new Error('useWalletSession must be used inside WalletSessionProvider');
  return context;
};
