import { useEffect, useMemo, useState } from 'react';
import { useWalletSession } from '../wallet/useWalletSession';
import { WalletModal } from '../components/WalletModal';
import { AvatarBadge } from '../components/AvatarBadge';
import { TokenFactoryPanel } from '../components/TokenFactoryPanel';
import { ChatPanel } from '../components/ChatPanel';
import { getDashboardSnapshot } from '../services/web3IdentityService';
import { useChatSocket } from '../chat/useChatSocket';
import { shortWallet } from '../auth/profileService';
import {
  buyLaunchpadToken,
  getAllTradableTokens,
  getPlatformTreasury,
  sellLaunchpadToken,
} from '../factory/tokenFactoryService';

export default function AppShell() {
  const { session, wallets, availability, connect, disconnect, refreshBalance } = useWalletSession();
  const [dashboard, setDashboard] = useState({ profile: null, tokens: [] });
  const [marketTokens, setMarketTokens] = useState([]);
  const [tradeAmount, setTradeAmount] = useState({});
  const [tradeStatus, setTradeStatus] = useState('');
  const [treasury, setTreasury] = useState({ snl1FeesCollected: 0 });
  const { messages, sendMessage, connected } = useChatSocket(dashboard.profile);

  const loadMarket = async () => {
    const [tokens, treasurySnapshot] = await Promise.all([getAllTradableTokens(), getPlatformTreasury()]);
    setMarketTokens(tokens);
    setTreasury(treasurySnapshot);
  };

  const reload = async () => {
    await refreshBalance();
    const snapshot = await getDashboardSnapshot(session);
    setDashboard(snapshot);
    await loadMarket();
  };

  useEffect(() => {
    reload();
  }, [session.address]);

  const walletTokenBalances = useMemo(() => session.balance?.tokenBalances || {}, [session.balance]);

  const tradeToken = async (tokenAddress, side) => {
    const amount = Number(tradeAmount[tokenAddress] || 0);

    try {
      if (side === 'buy') {
        await buyLaunchpadToken({ tokenAddress, walletAddress: session.address, amount });
      } else {
        await sellLaunchpadToken({ tokenAddress, walletAddress: session.address, amount });
      }

      setTradeStatus(`${side.toUpperCase()} success for ${amount} tokens.`);
      await reload();
    } catch (error) {
      setTradeStatus(`${side.toUpperCase()} failed: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-2xl font-bold">SNL1 Web3 Social Token Launchpad</h1>
          <p className="text-sm text-slate-300">Pump.fun-style simulation engine with bonding curve market + platform fees.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Wallet: {shortWallet(session.address)}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Type: {session.walletType || 'none'}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Network: {session.chainId || '-'}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">SNL1: {session.balance.snl1Balance.toLocaleString()}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Treasury Fees: {treasury.snl1FeesCollected.toLocaleString()} SNL1</span>
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
              <h3 className="text-lg font-semibold">Bonding Curve Market (Simulation Mode)</h3>
              <p className="mt-1 text-xs text-slate-400">Pricing model: price = basePrice + k × supply. Fee: 2% each trade, routed to SNL1 treasury.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {marketTokens.map((token) => (
                  <article key={token.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                    <div className="flex items-center gap-3">
                      {token.logo ? <img src={token.logo} alt={token.name} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-slate-800" />}
                      <div>
                        <div className="font-semibold">{token.name} ({token.symbol})</div>
                        <div className="text-xs text-slate-400">{token.tokenAddress}</div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <p>Price: <span className="text-emerald-300">{token.currentPrice} SNL1</span></p>
                      <p>Supply: <span className="text-cyan-300">{token.circulatingSupply.toLocaleString()}</span></p>
                      <p>MCap: <span className="text-amber-300">{token.marketCap.toLocaleString()} SNL1</span></p>
                      <p>Holders: <span className="text-fuchsia-300">{token.holders}</span></p>
                      <p>Reserve: <span className="text-slate-200">{token.reserveBalance.toLocaleString()} SNL1</span></p>
                      <p>Your Bal: <span className="text-slate-200">{(walletTokenBalances[token.tokenAddress] || 0).toLocaleString()}</span></p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={tradeAmount[token.tokenAddress] || ''}
                        onChange={(event) =>
                          setTradeAmount((prev) => ({ ...prev, [token.tokenAddress]: event.target.value }))
                        }
                        placeholder="Amount"
                        className="w-full rounded bg-slate-800 p-2 text-sm"
                      />
                      <button className="rounded bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950" onClick={() => tradeToken(token.tokenAddress, 'buy')}>Buy</button>
                      <button className="rounded bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950" onClick={() => tradeToken(token.tokenAddress, 'sell')}>Sell</button>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Created {new Date(token.timestamp).toLocaleString()}</div>
                  </article>
                ))}
                {!marketTokens.length ? <p className="text-sm text-slate-400">No tradable tokens yet. Launch one to begin market simulation.</p> : null}
              </div>
            </div>

            <div className="lg:col-span-3">
              {tradeStatus ? <p className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-950/40 p-2 text-xs text-cyan-100">{tradeStatus}</p> : null}
              <ChatPanel profile={dashboard.profile} messages={messages} sendMessage={sendMessage} connected={connected} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
