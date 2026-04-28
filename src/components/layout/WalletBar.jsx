import { useState } from 'react';
import { useWalletContext } from '../../context/WalletContext';

const shortenAddress = (value = '') => {
  if (!value) return 'Not Connected';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const titleByType = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
  trust: 'Trust Wallet',
};

const WalletBar = () => {
  const {
    isConnected,
    walletAddress,
    walletType,
    connectWallet,
    disconnectWallet,
    supportedWallets,
    walletAvailability,
    connectionState,
    walletConnectUri,
    chainId,
    networkName,
  } = useWalletContext();

  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = async (targetWallet) => {
    try {
      setError('');
      await connectWallet(targetWallet);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet.');
    }
  };

  return (
    <>
      <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">SNL1 Sentinel Launchpad</p>
          <p className="text-sm text-cyan-200">{shortenAddress(walletAddress)}</p>
          <p className="text-xs text-slate-400">
            {isConnected ? `${titleByType[walletType]} • ${networkName} (${chainId})` : 'Wallet disconnected'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <button
                className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm text-cyan-100"
                onClick={() => setIsModalOpen(true)}
              >
                Switch Wallet
              </button>
              <button className="rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-200" onClick={disconnectWallet}>
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900"
              onClick={() => setIsModalOpen(true)}
            >
              Connect Wallet
            </button>
          )}
        </div>
        {error ? <p className="ml-4 text-xs text-rose-300">{error}</p> : null}
      </header>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-100">Select wallet</h3>
              <button className="text-sm text-slate-400" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="space-y-2">
              {supportedWallets.map((wallet) => {
                const isAvailable = walletAvailability[wallet.id];
                return (
                  <button
                    key={wallet.id}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-700 px-4 py-3 text-left text-sm text-slate-100 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!isAvailable || connectionState === 'connecting'}
                    onClick={() => handleConnect(wallet.id)}
                  >
                    <span>{wallet.label}</span>
                    <span className="text-xs text-slate-400">{isAvailable ? 'Available' : 'Not detected'}</span>
                  </button>
                );
              })}
            </div>

            {connectionState === 'connecting' ? <p className="mt-4 text-xs text-cyan-200">Connecting wallet...</p> : null}
            {walletConnectUri ? (
              <div className="mt-4 rounded-lg border border-cyan-500/30 bg-slate-900/80 p-3 text-xs text-slate-300">
                <p className="mb-1 text-cyan-200">WalletConnect pairing URI (open in wallet app):</p>
                <p className="break-all">{walletConnectUri}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default WalletBar;
