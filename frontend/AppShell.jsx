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
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [reloadError, setReloadError] = useState('');

  const [marketTokens, setMarketTokens] = useState([]);
  const [tradeAmount, setTradeAmount] = useState({});
  const [tradeStatus, setTradeStatus] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [treasury, setTreasury] = useState({ snl1FeesCollected: 0 });

  const [growth, setGrowth] = useState({
    tokens: [],
    leaderboards: { users: {}, tokens: {} },
    walletStats: [],
    activity: [],
  });
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [referralJoined, setReferralJoined] = useState(false);
  const [connectError, setConnectError] = useState('');

  const { messages, sendMessage, connected, joinRoom, activeRoom, rooms, error } = useChatSocket(
    dashboard.profile,
    dashboard.tokens,
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
    setReloadError('');
    setIsBootstrapping(true);
    try {
      await refreshBalance();
      const snapshot = await getDashboardSnapshot(session);
      setDashboard(snapshot);
      await loadMarket();
      await loadGrowth();
    } catch (e) {
      setReloadError(e?.message || 'Failed to refresh dashboard state.');
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    reload();
  }, [session.address]);

  useEffect(() => {
    loadGrowth();
  }, [messages]);

  useEffect(() => {
    const syncOnStorage = () => {
      loadMarket();
      loadGrowth();
    };
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

  const handleTrade = async (tokenAddress, side) => {
    const amount = Number(tradeAmount[tokenAddress] || 10);

    if (!session.networkStatus?.ok) {
      setTradeStatus('Error: switch to a supported network before trading.');
      return;
    }

    if (!amount || amount <= 0) {
      setTradeStatus('Error: amount must be greater than zero.');
      return;
    }

    setIsTrading(true);
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
    } finally {
      setIsTrading(false);
    }
  };

  const shareToken = async (tokenId) => {
    const shareLink = await getTokenShareLink({ tokenId, walletAddress: session.address });
    await navigator.clipboard.writeText(shareLink);
    alert('Share link copied to clipboard!');
  };

  const handleConnect = async (walletType) => {
    setConnectError('');
    try {
      await connect(walletType);
    } catch (e) {
      setConnectError(e?.message || 'Failed to connect wallet.');
    }
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
            <span className={`rounded px-3 py-1 text-xs ${session.networkStatus?.ok ? 'bg-emerald-900 text-emerald-200' : 'bg-amber-900 text-amber-200'}`}>
              Network: {session.chainId || 'Not selected'}
            </span>
            {!!notifications.length && <span className="rounded bg-cyan-950 px-3 py-1 text-xs">Alerts: {notifications.length}</span>}
            {session.isConnected && <button className="rounded bg-rose-400 px-3 py-1 text-xs text-slate-950" onClick={disconnect}>Disconnect</button>}
          </div>
          {!session.networkStatus?.ok && session.isConnected ? (
            <p className="mt-3 rounded border border-amber-500/40 bg-amber-950/40 p-2 text-xs text-amber-200">
              {session.networkStatus?.reason || 'Unsupported network selected. Some actions are disabled.'}
            </p>
          ) : null}
          {session.error ? (
            <p className="mt-3 rounded border border-rose-500/40 bg-rose-950/40 p-2 text-xs text-rose-200">
              Wallet error: {session.error.message}
            </p>
          ) : null}
          {reloadError ? (
            <p className="mt-3 rounded border border-rose-500/40 bg-rose-950/40 p-2 text-xs text-rose-200">
              {reloadError}
            </p>
          ) : null}
        </header>

        {session.isConnected ? (
          <section className="grid gap-4 lg:grid-cols-3">
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

            <div className="space-y-4 lg:col-span-2">
              <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-lg font-semibold mb-3">Live Bonding Curve Market</h3>
                {isBootstrapping ? <p className="mb-3 text-xs text-cyan-300">Loading market data...</p> : null}
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
                          onChange={(e) => setTradeAmount((prev) => ({ ...prev, [token.tokenAddress]: e.target.value }))}
                        />
                        <button disabled={isTrading || !session.networkStatus?.ok} onClick={() => handleTrade(token.tokenAddress, 'buy')} className="bg-emerald-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold disabled:opacity-50">BUY</button>
                        <button disabled={isTrading || !session.networkStatus?.ok} onClick={() => handleTrade(token.tokenAddress, 'sell')} className="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold disabled:opacity-50">SELL</button>
                        <button onClick={() => setSelectedTokenId(token.id)} className="bg-slate-700 px-2 py-1 rounded text-[10px]">INFO</button>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

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
          <WalletModal
            wallets={wallets}
            availability={availability}
            onConnect={handleConnect}
            connectingType={session.status === 'connecting' ? session.walletType : ''}
            error={connectError}
          />
        )}
      </div>
    </main>
  );
}

const ReferralCount = ({ tokenId, referrer }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (tokenId && referrer) {
      getReferralJoins({ tokenId, referrer }).then(setCount);
    }
  }, [tokenId, referrer]);

  return <span className="text-cyan-400 font-bold">{count}</span>;
};
