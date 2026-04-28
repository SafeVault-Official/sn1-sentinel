import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMockWalletSnapshot } from '../services/mockBlockchain';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balances, setBalances] = useState({ usdBalance: 0, snl1Balance: 0 });

  useEffect(() => {
    setIsWalletAvailable(Boolean(window?.ethereum));
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setBalances({ usdBalance: 0, snl1Balance: 0 });
      return;
    }

    let active = true;
    setIsLoadingBalance(true);

    getMockWalletSnapshot(walletAddress)
      .then((snapshot) => {
        if (active) {
          setBalances(snapshot);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingBalance(false);
        }
      });

    return () => {
      active = false;
    };
  }, [walletAddress]);

  useEffect(() => {
    if (!window?.ethereum) {
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      if (!accounts.length) {
        setIsConnected(false);
        setWalletAddress('');
        return;
      }

      setWalletAddress(accounts[0]);
      setIsConnected(true);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (!window?.ethereum) {
      throw new Error('No injected wallet found. Please install MetaMask.');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts.length) {
      throw new Error('Wallet connection was denied.');
    }

    setWalletAddress(accounts[0]);
    setIsConnected(true);
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
  };

  const value = useMemo(
    () => ({
      walletAddress,
      isConnected,
      isWalletAvailable,
      isLoadingBalance,
      balances,
      connectWallet,
      disconnectWallet,
    }),
    [walletAddress, isConnected, isWalletAvailable, isLoadingBalance, balances],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWalletContext must be used inside WalletProvider.');
  }

  return context;
};
