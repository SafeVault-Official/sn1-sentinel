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
  sellLaunchpadToken,
  getAllTradableTokens,
  getPlatformTreasury,
  getGrowthSnapshot,
  getLaunchpadTokenDetail,
  getReferralJoins,
  getTokenShareLink,
  getWalletNotifications,
  registerReferral,
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
  
  // Market ve Finansal State (Codex)
  const [marketTokens, setMarketTokens] = useState([]);
  const [tradeAmount, setTradeAmount] = useState({});
  const [tradeStatus, setTradeStatus] = useState('');
  const [treasury, setTreasury] = useState({ snl1FeesCollected: 0 });

  // Büyüme ve Sosyal State (Main)
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

  // Chat Socket
  const { messages, sendMessage, connected, joinRoom, activeRoom, rooms, error } = useChatSocket(
    dashboard.profile, 
    dashboard.tokens
  );

  const loadMarket = async () => {
    const [tokens, treasurySnapshot] = await Promise.all([getAllTradableTokens(), getPlatformTreasury()]);
    setMarketTokens(tokens);
    setTreasury(treasurySnapshot);
  };

  const loadGrowth = async () => {
    const snapshot = await getGrowthSnapshot({ chatMessages: messages });
    setGrowth(snapshot);
  };

  const reload = async () => {
    await refreshBalance();
    const snapshot = await getDashboardSnapshot(session);
    setDashboard(snapshot);
    await loadMarket();
    await loadGrowth();
  };

  useEffect(() => {
    reload();
  }, [session.address]);

  useEffect(() => {
    loadGrowth();
  }, [messages]);

  useEffect(() => {
    const syncOnStorage = () => { loadMarket(); loadGrowth(); };
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

  const walletTokenBalances = useMemo(() => session.balance?.tokenBalances || {}, [session.balance]);
  
  const myReputation = useMemo(
    () => growth.walletStats.find((item) => item.walletAddress === session.address),
    [growth.walletStats, session.address],
  );

  const handleTrade = async (tokenAddress, side) => {
    const amount = Number(tradeAmount[tokenAddress] || 10);
    try {
      if (side === 'buy') {
        await buyLaunchpadToken({ tokenAddress, walletAddress: session.address, amount });
      } else {
        await sellLaunchpadToken({ tokenAddress, walletAddress: session.address, amount });
      }
      setTradeStatus(`${side.toUpperCase()} success!`);
      await reload();
    } catch (err) {
      setTradeStatus(`Error: ${err.message}`);
    }
  };

  const shareToken = async (tokenId) => {
    const shareLink = await getTokenShareLink({ tokenId, walletAddress: session.address });
    await navigator.clipboard.writeText(shareLink);
    alert("Share link copied to clipboard!");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">SNL1 Growth & Bonding Engine</h1>
              <p className="text-sm text-slate-300">Bonding curve economy meet viral growth loops.</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              Treasury: <span className="text-emerald-400">{treasury.snl1FeesCollected.toLocaleString()} SNL1</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-slate-800 px-3 py-1 text-xs">Wallet: {shortWallet(session.address)}</span>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs text-cyan-300">SNL1: {session.balance.snl1Balance.toLocaleString()}</span>
            <span className="rounded bg-indigo-900 px-3 py-1 text-xs">Reputation: {myReputation?.reputationLevel || 'Newbie'}</span>
            {session.isConnected && <button className="rounded bg-rose-400 px-3 py-1 text-xs text-slate-950" onClick={disconnect}>Disconnect</button>}
          </div>
        </header>

        {session.isConnected ? (
          <section className="grid gap-4 lg:grid-cols-3">
            {/* SOL KOLON: Profil ve Factory */}
            <div className="space-y-4">
              <AvatarBadge avatar={dashboard.profile?.avatar} />
              <TokenFactoryPanel walletAddress={session.address} onCreated={reload} />
              
              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="font-semibold mb-2">My Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {(myReputation?.achievements || []).map((badge) => (
                    <div className="rounded bg-slate-800 px-2 py-1 text-xs" key={badge}>🏅 {ACHIEVEMENTS[badge] || badge}</div>
                  ))}
                  {!(myReputation?.achievements || []).length && <span className="text-xs text-slate-500">No badges yet.</span>}
                </div>
              </article>
            </div>

            {/* ORTA KOLON: Market ve Trendler */}
            <div className="space-y-4 lg:col-span-2">
              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-lg font-semibold mb-3">Live Bonding Curve Market</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {marketTokens.map((token) => (
                    <article key={token.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-cyan-400">{token.symbol}</span>
                        <span className="text-[10px] bg-slate-800 px-2 rounded-full uppercase">{token.holdersCount} Holders</span>
                      </div>
                      <div className="my-2 text-xs grid grid-cols-2 gap-1 text-slate-400">
                        <p>Price: <span className="text-white">{token.currentPrice}</span></p>
                        <p>MCap: <span className="text-white">{Math.round(token.marketCap)}</span></p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="number" 
                          className="w-full bg-slate-800 rounded px-2 text-xs" 
                          placeholder="Amt"
                          onChange={(e) => setTradeAmount(prev => ({...prev, [token.tokenAddress]: e.target.value}))}
                        />
                        <button onClick={() => handleTrade(token.tokenAddress, 'buy')} className="bg-emerald-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">BUY</button>
                        <button onClick={() => handleTrade(token.tokenAddress, 'sell')} className="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">SELL</button>
                        <button onClick={() => setSelectedTokenId(token.id)} className="bg-slate-700 px-2 py-1 rounded text-[10px]">INFO</button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              {/* Activity Feed */}
              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-sm font-semibold mb-2">Global Activity</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {growth.activity.slice(0, 10).map((event) => (
                    <div key={event.id} className="text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                      {event.message} <span className="opacity-50">• {new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            {/* ALT: Chat ve Detay */}
            <div className="lg:col-span-3">
              {tradeStatus && <div className="mb-4 p-2 bg-cyan-900/30 border border-cyan-500 text-cyan-200 text-xs rounded">{tradeStatus}</div>}
              <ChatPanel 
                profile={dashboard.profile} 
                messages={messages} 
                sendMessage={sendMessage} 
                connected={connected} 
                joinRoom={joinRoom} 
                activeRoom={activeRoom} 
                rooms={rooms} 
                error={error} 
              />
            </div>

            {selectedToken && (
              <div className="lg:col-span-3 rounded-2xl border border-cyan-500 bg-slate-900 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{selectedToken.name} Detail View</h2>
                  <button onClick={() => setSelectedToken(null)} className="text-slate-400">Close</button>
                </div>
                <MiniChart data={selectedToken.history} />
                <div className="mt-4 flex gap-4 items-center">
                  <button className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-bold" onClick={() => shareToken(selectedToken.id)}>Copy Viral Share Link</button>
                  <p className="text-xs text-slate-400">Viral Joins: <ReferralCount tokenId={selectedToken.id} referrer={session.address} /></p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <WalletModal wallets={wallets} availability={availability} onConnect={connect} />
        )}
      </div>
    </main>
  );
}

const ReferralCount = ({ tokenId, referrer }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (tokenId && referrer) getReferralJoins({ tokenId, referrer }).then(setCount);
  }, [tokenId, referrer]);
  return <span className="text-cyan-400 font-bold">{count}</span>;
};