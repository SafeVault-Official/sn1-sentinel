import { useState } from 'react';
import { useWalletContext } from '../../context/WalletContext';

const shortenAddress = (value = '') => {
  if (!value) return 'Not Connected';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const WalletBar = () => {
  const { isConnected, walletAddress, connectWallet, disconnectWallet, isWalletAvailable } = useWalletContext();
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      setError('');
      await connectWallet();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">SNL1 Sentinel Launchpad</p>
        <p className="text-sm text-cyan-200">{shortenAddress(walletAddress)}</p>
      </div>
      <div className="flex items-center gap-3">
        {!isWalletAvailable ? <p className="text-xs text-rose-300">Install MetaMask to connect.</p> : null}
        {isConnected ? (
          <button className="rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-200" onClick={disconnectWallet}>
            Disconnect
          </button>
        ) : (
          <button
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleConnect}
            disabled={!isWalletAvailable}
          >
            Connect Wallet
          </button>
        )}
      </div>
      {error ? <p className="ml-4 text-xs text-rose-300">{error}</p> : null}
    </header>
  );
};

export default WalletBar;
