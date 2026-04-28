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
  getGrowthSnapshot,
  getLaunchpadTokenDetail,
  getReferralJoins,
  getTokenShareLink,
  getWalletNotifications,
  registerReferral,
  tradeLaunchpadToken,
} from '../factory/tokenFactoryService';

const ACHIEVEMENTS = {
  first_token_created: 'First Token Created',
  first_trade: 'First Trade',
  whale_status: 'Whale Status',
};

const MiniChart = ({ data = [] }) => {
  if (!data.length) return <p className="text-xs text-slate-500">No chart data yet.</p>;
  const ys = data.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const points = data
    .map((point, index) => {
      const x = (index / Math.max(1, data.length - 1)) * 100;
      const y = 100 - ((point.y - min) / Math.max(0.0001, max - min)) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-32 w-full rounded bg-slate-950">
      <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2" />
    </svg>
  );
};

export default function AppShell() {
  const { session, wallets, availability, connect, disconnect, refreshBalance } = useWalletSession();
  const [dashboard, setDashboard] = useState({ profile: null, tokens: [] });
// useChatSocket'i main dalındaki genişletilmiş parametrelerle kullanıyoruz
  const { messages, sendMessage, connected, joinRoom, activeRoom, rooms, error } = useChatSocket(
    dashboard.profile, 
    dashboard.tokens
  );

  // codex dalındaki state tanımlarını koruyoruz
  const [growth, setGrowth] = useState({ 
    tokens: [], 
    leaderboards: { users: {}, tokens: {} }, 
    walletStats: [], 
    activity: [] 
  });
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [referralJoined, setReferralJoined] = useState(false);

  const reload = async () => {
    await refreshBalance();
    const snapshot = await getDashboardSnapshot(session);
    setDashboard(snapshot);
  };

  const loadGrowth = async () => {
    const snapshot = await getGrowthSnapshot({ chatMessages: messages });
    setGrowth(snapshot);
  };

  useEffect(() => {
    reload();
  }, [session.address]);

  useEffect(() => {
    loadGrowth();
  }, [messages]);

  useEffect(() => {
    const syncOnStorage = () => loadGrowth();
    window.addEventListener('sn1:state-updated', syncOnStorage);
    return () => window.removeEventListener('sn1:state-updated', syncOnStorage);
  }, [messages]);

  useEffect(() => {
    if (!selectedTokenId) return;
    getLaunchpadTokenDetail(selectedTokenId).then(setSelectedToken);
  }, [selectedTokenId, growth]);

  useEffect(() => {
    if (!session.address) return;
    getWalletNotifications(session.address).then(setNotifications);
  }, [session.address, growth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenId = params.get('token');
    const ref = params.get('ref');
    if (tokenId && ref && !referralJoined) {
      registerReferral({ tokenId, referrer: ref });
      setReferralJoined(true);
    }
  }, [referralJoined]);

  const myReputation = useMemo(
    () => growth.walletStats.find((item) => item.walletAddress === session.address),
    [growth.walletStats, session.address],
  );

  const trade = async (tokenId, type) => {
    await tradeLaunchpadToken({ walletAddress: session.address, tokenId, type, amount: 10 });
    await reload();
    await loadGrowth();
  };

  const shareToken = async (tokenId) => {
    const shareLink = await getTokenShareLink({ tokenId, walletAddress: session.address });
    await navigator.clipboard.writeText(shareLink);
    await loadGrowth();
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-2xl font-bold">SNL1 Web3 Growth Engine</h1>
          <p className="text-sm text-slate-300">Trading + social + gamification stack with trending, competition, and viral loops.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Wallet: {shortWallet(session.address)}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">SNL1: {session.balance.snl1Balance.toLocaleString()}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">USD: {session.balance.usdBalance.toLocaleString()}</span>
            <span className="rounded bg-indigo-900 px-3 py-1 text-xs">Reputation: {myReputation?.reputationLevel || 'Newbie'}</span>
            {session.isConnected ? <button className="rounded bg-rose-400 px-3 py-1 text-xs text-slate-950" onClick={disconnect}>Disconnect</button> : null}
          </div>
        </header>

        {!session.isConnected ? <WalletModal wallets={wallets} availability={availability} onConnect={connect} connectingType={session.status === 'connecting' ? session.walletType : ''} /> : null}

        {session.isConnected ? (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <AvatarBadge avatar={dashboard.profile?.avatar} />
              <TokenFactoryPanel walletAddress={session.address} onCreated={reload} />

              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="font-semibold">Gamification</h3>
                <p className="text-xs text-slate-400">Score {myReputation?.score || 0} • {myReputation?.reputationLevel || 'Newbie'}</p>
                <div className="mt-2 space-y-1 text-xs">
                  {(myReputation?.achievements || []).map((badge) => (
                    <div className="rounded bg-slate-800 px-2 py-1" key={badge}>🏅 {ACHIEVEMENTS[badge] || badge}</div>
                  ))}
                  {!(myReputation?.achievements || []).length ? <div className="text-slate-500">No achievements unlocked yet.</div> : null}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="font-semibold">Notifications</h3>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
                  {notifications.map((item) => (
                    <div key={item.id} className="rounded border border-slate-800 bg-slate-950 p-2">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-slate-400">{item.body}</div>
                    </div>
                  ))}
                  {!notifications.length ? <p className="text-slate-500">No notifications yet.</p> : null}
                </div>
              </article>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-lg font-semibold">Trending Tokens</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {growth.tokens.slice(0, 8).map((token) => (
                    <button key={token.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left" onClick={() => setSelectedTokenId(token.id)}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{token.symbol}</div>
                        <span className="rounded bg-amber-900 px-2 py-0.5 text-xs">{token.trendTag}</span>
                      </div>
                      <div className="text-xs text-slate-400">Vol ${token.recentVolume} • Holders {token.holders.length} • Mentions {token.mentions}</div>
                      <div className="text-xs text-cyan-300">Trend score {token.trendScore}</div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-lg font-semibold">Leaderboards</h3>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium">Top Traders</h4>
                    {(growth.leaderboards.users.topTraders || []).slice(0, 5).map((user) => <p className="text-xs" key={user.walletAddress}>{shortWallet(user.walletAddress)} • {user.trades} trades</p>)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Biggest Holders</h4>
                    {(growth.leaderboards.users.biggestHolders || []).slice(0, 5).map((user) => <p className="text-xs" key={user.walletAddress}>{shortWallet(user.walletAddress)} • ${user.holdings.toFixed(2)}</p>)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Highest Market Cap</h4>
                    {(growth.leaderboards.tokens.highestMarketCap || []).slice(0, 5).map((token) => <p className="text-xs" key={token.id}>{token.symbol} • ${token.marketCap.toFixed(2)}</p>)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Most Traded</h4>
                    {(growth.leaderboards.tokens.mostTraded || []).slice(0, 5).map((token) => <p className="text-xs" key={token.id}>{token.symbol} • {token.totalTrades} trades</p>)}
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-lg font-semibold">Activity Feed</h3>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
                  {growth.activity.map((event) => <div key={event.id} className="rounded border border-slate-800 bg-slate-950 p-2">{event.message} • {new Date(event.timestamp).toLocaleTimeString()}</div>)}
                </div>
              </article>
            </div>

            <div className="lg:col-span-3">
              <ChatPanel profile={dashboard.profile} messages={messages} sendMessage={sendMessage} connected={connected} joinRoom={joinRoom} activeRoom={activeRoom} rooms={rooms} error={error} />
            </div>

            {selectedToken ? (
              <div className="lg:col-span-3 rounded-2xl border border-cyan-700 bg-slate-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">Token Page: {selectedToken.name} ({selectedToken.symbol})</h3>
                  <span className="text-sm text-cyan-300">Price ${selectedToken.price}</span>
                </div>
                <MiniChart data={selectedToken.history} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded bg-emerald-500 px-3 py-1 text-xs text-slate-950" onClick={() => trade(selectedToken.id, 'buy')}>Buy 10</button>
                  <button className="rounded bg-amber-500 px-3 py-1 text-xs text-slate-950" onClick={() => trade(selectedToken.id, 'sell')}>Sell 10</button>
                  <button className="rounded bg-sky-500 px-3 py-1 text-xs text-slate-950" onClick={() => shareToken(selectedToken.id)}>Copy Share Link</button>
                </div>
                <div className="mt-2 text-xs text-slate-400">Holders: {selectedToken.holders.length} • Trades: {selectedToken.trades.length}</div>
                <div className="text-xs text-slate-400">
                  Joined from this link: <ReferralCount tokenId={selectedToken.id} referrer={session.address} />
                </div>
                <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                  {selectedToken.trades.slice(0, 10).map((tradeEvent) => <div key={tradeEvent.id}>{shortWallet(tradeEvent.walletAddress)} {tradeEvent.type} {tradeEvent.amount} • ${tradeEvent.usdValue}</div>)}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

const ReferralCount = ({ tokenId, referrer }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tokenId || !referrer) return;
    getReferralJoins({ tokenId, referrer }).then(setCount);
  }, [tokenId, referrer]);

  return <span>{count}</span>;
};
