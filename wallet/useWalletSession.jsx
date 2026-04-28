import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { walletAdapters, WALLET_OPTIONS } from './providers';
import { getBalance } from '../mock-blockchain/mockBlockchainService';

const WalletSessionContext = createContext(null);

export const WalletSessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    isConnected: false,
    walletType: '',
    address: '',
    chainId: '',
    walletFamily: 'evm',
    balance: { usdBalance: 0, snl1Balance: 0 },
    status: 'idle',
  });
  const providerRef = useRef(null);
  const unwatchRef = useRef(() => undefined);

  const connect = useCallback(async (walletType) => {
    const adapter = walletAdapters[walletType];
    if (!adapter) throw new Error('Wallet adapter not found.');

    setSession((prev) => ({ ...prev, status: 'connecting' }));

    const connection = await adapter.connect();
    providerRef.current = connection.provider;

    unwatchRef.current?.();
    unwatchRef.current = adapter.watch?.(connection.provider, {
      onAccountsChanged: (accounts = []) => {
        if (!accounts[0]) {
          setSession((prev) => ({ ...prev, isConnected: false, address: '', status: 'idle' }));
          return;
        }
        setSession((prev) => ({ ...prev, address: accounts[0] }));
      },
      onChainChanged: (chainId) => {
        setSession((prev) => ({ ...prev, chainId }));
      },
    }) || (() => undefined);

    const balance = await getBalance(connection.address);

    setSession({
      isConnected: true,
      walletType,
      address: connection.address,
      chainId: connection.chainId || '',
      walletFamily: connection.walletFamily || 'evm',
      balance,
      status: 'connected',
    });
  }, []);

  const disconnect = useCallback(async () => {
    if (session.walletType) {
      await walletAdapters[session.walletType]?.disconnect?.(providerRef.current);
    }
    unwatchRef.current?.();
    providerRef.current = null;
    setSession({
      isConnected: false,
      walletType: '',
      address: '',
      chainId: '',
      walletFamily: 'evm',
      balance: { usdBalance: 0, snl1Balance: 0 },
      status: 'idle',
    });
  }, [session.walletType]);

  const refreshBalance = useCallback(async () => {
    if (!session.address) return;
    const balance = await getBalance(session.address);
    setSession((prev) => ({ ...prev, balance }));
  }, [session.address]);

  const availability = useMemo(
    () => Object.fromEntries(WALLET_OPTIONS.map((wallet) => [wallet.id, walletAdapters[wallet.id].detect()])),
    [],
  );

  const value = useMemo(() => ({ session, connect, disconnect, refreshBalance, wallets: WALLET_OPTIONS, availability }), [
    session,
    connect,
    disconnect,
    refreshBalance,
    availability,
  ]);

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
};

export const useWalletSession = () => {
  const context = useContext(WalletSessionContext);
  if (!context) throw new Error('useWalletSession must be used inside WalletSessionProvider');
  return context;
};
