import { useEffect, useState } from 'react';
import { useWalletSession } from '../wallet/useWalletSession';
import { WalletModal } from '../components/WalletModal';
import { AvatarBadge } from '../components/AvatarBadge';
import { TokenFactoryPanel } from '../components/TokenFactoryPanel';
import { ChatPanel } from '../components/ChatPanel';
import { getDashboardSnapshot } from '../services/web3IdentityService';
import { useChatSocket } from '../chat/useChatSocket';
import { shortWallet } from '../auth/profileService';

export default function AppShell() {
  const { session, wallets, availability, connect, disconnect, refreshBalance } = useWalletSession();
  const [dashboard, setDashboard] = useState({ profile: null, tokens: [] });
  const { messages, sendMessage, connected } = useChatSocket(dashboard.profile);

  const reload = async () => {
    await refreshBalance();
    const snapshot = await getDashboardSnapshot(session);
    setDashboard(snapshot);
  };

  useEffect(() => {
    reload();
  }, [session.address]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-2xl font-bold">SNL1 Web3 Social Token Launchpad</h1>
          <p className="text-sm text-slate-300">Production-style modular architecture (mock blockchain now, contract-ready next).</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Wallet: {shortWallet(session.address)}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Type: {session.walletType || 'none'}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Network: {session.chainId || '-'}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">SNL1: {session.balance.snl1Balance.toLocaleString()}</span>
            {session.isConnected ? <button className="rounded bg-rose-400 px-3 py-1 text-xs text-slate-950" onClick={disconnect}>Disconnect</button> : null}
          </div>
        </header>

        {!session.isConnected ? <WalletModal wallets={wallets} availability={availability} onConnect={connect} connectingType={session.status === 'connecting' ? session.walletType : ''} /> : null}

        {session.isConnected ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <AvatarBadge avatar={dashboard.profile?.avatar} />
              <TokenFactoryPanel walletAddress={session.address} onCreated={reload} />
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold">Created Tokens Dashboard</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {dashboard.tokens.map((token) => (
                  <article key={token.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                    <div className="flex items-center gap-3">
                      <img src={token.logo} alt={token.name} className="h-10 w-10 rounded object-cover" />
                      <div>
                        <div className="font-semibold">{token.name} ({token.symbol})</div>
                        <div className="text-xs text-slate-400">Supply {token.supply.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Created {new Date(token.timestamp).toLocaleString()}</div>
                  </article>
                ))}
                {!dashboard.tokens.length ? <p className="text-sm text-slate-400">No tokens minted yet from this wallet.</p> : null}
              </div>
            </div>

            <div className="lg:col-span-3">
              <ChatPanel profile={dashboard.profile} messages={messages} sendMessage={sendMessage} connected={connected} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
