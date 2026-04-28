import { useState } from 'react';
import AvatarCard from './components/dashboard/AvatarCard';
import CreatedTokensCard from './components/dashboard/CreatedTokensCard';
import StatsCard from './components/dashboard/StatsCard';
import TokenFactoryCard from './components/dashboard/TokenFactoryCard';
import WalletBar from './components/layout/WalletBar';
import { useWalletContext } from './context/WalletContext';

const App = () => {
  const { walletAddress, isConnected, balances, isLoadingBalance } = useWalletContext();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <WalletBar />

      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-white">SNL1 Launchpad Simulator</h1>
        <p className="mt-2 text-sm text-slate-300">
          Frontend-first architecture with modular mock blockchain adapters, ready for future ERC-20 + token factory contracts.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <StatsCard
            walletAddress={walletAddress}
            snl1Balance={balances.snl1Balance}
            usdBalance={balances.usdBalance}
            isLoadingBalance={isLoadingBalance}
          />
          <AvatarCard usdBalance={balances.usdBalance} />
          <TokenFactoryCard
            walletAddress={walletAddress}
            isConnected={isConnected}
            onCreated={() => setRefreshKey((prev) => prev + 1)}
          />
          <CreatedTokensCard walletAddress={walletAddress} refreshKey={refreshKey} />
        </div>
      </section>
    </main>
  );
};

export default App;
