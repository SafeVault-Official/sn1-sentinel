import { readState, updateState } from './stateStore';

const randomFloat = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));

const initializeWallet = (walletAddress, state) => {
  if (!state.wallets[walletAddress]) {
    state.wallets[walletAddress] = {
      usdBalance: randomFloat(2, 1600),
      snl1Balance: randomFloat(1000, 250000),
      createdAt: new Date().toISOString(),
    };
  }
  return state;
};

const pushActivity = (draft, type, message, payload = {}) => {
  draft.activity.unshift({
    id: crypto.randomUUID(),
    type,
    message,
    timestamp: new Date().toISOString(),
    payload,
  });
  draft.activity = draft.activity.slice(0, 250);
};

const addNotification = (draft, walletAddress, title, body) => {
  if (!walletAddress) return;
  if (!draft.notifications[walletAddress]) draft.notifications[walletAddress] = [];
  draft.notifications[walletAddress].unshift({
    id: crypto.randomUUID(),
    title,
    body,
    timestamp: new Date().toISOString(),
    read: false,
  });
  draft.notifications[walletAddress] = draft.notifications[walletAddress].slice(0, 50);
};

const getTokenPrice = (token, trades) => {
  const supplyFactor = Math.max(1, token.supply / 10000);
  const tradeImpact = trades.reduce((acc, tx) => acc + (tx.type === 'buy' ? tx.amount : -tx.amount), 0) / 5000;
  return Number((0.03 + supplyFactor * 0.002 + tradeImpact).toFixed(4));
};

const getWalletTokenBalance = (walletAddress, tokenId, state) => {
  return state.tokenTrades
    .filter((tx) => tx.walletAddress === walletAddress && tx.tokenId === tokenId)
    .reduce((acc, tx) => acc + (tx.type === 'buy' ? tx.amount : -tx.amount), 0);
};

const unlockAchievement = (draft, walletAddress, key) => {
  if (!walletAddress) return;
  if (!draft.achievements[walletAddress]) draft.achievements[walletAddress] = [];
  if (draft.achievements[walletAddress].includes(key)) return;
  draft.achievements[walletAddress].push(key);
};

export const getBalance = async (walletAddress) => {
  const state = updateState((draft) => initializeWallet(walletAddress, draft));
  return state.wallets[walletAddress];
};

export const createToken = async (tokenPayload) => {
  const token = {
    id: crypto.randomUUID(),
    ...tokenPayload,
    holders: [tokenPayload.creatorWallet],
    timestamp: new Date().toISOString(),
  };

  updateState((draft) => {
    initializeWallet(token.creatorWallet, draft);
    draft.tokens.unshift(token);
    draft.tokenTrades.unshift({
      id: crypto.randomUUID(),
      tokenId: token.id,
      walletAddress: token.creatorWallet,
      amount: Math.max(1, Math.round(token.supply * 0.05)),
      usdValue: Number((token.supply * 0.004).toFixed(2)),
      type: 'buy',
      timestamp: new Date().toISOString(),
    });
    unlockAchievement(draft, token.creatorWallet, 'first_token_created');
    pushActivity(draft, 'token_created', `${token.creatorWallet.slice(0, 6)} created ${token.symbol}`, { tokenId: token.id });
    addNotification(draft, token.creatorWallet, 'Token launched', `${token.name} is now live.`);
    return draft;
  });

  return token;
};

export const getTokens = async (walletAddress) => {
  const state = readState();
  return state.tokens.filter((token) => token.creatorWallet === walletAddress);
};

export const getAllTokens = async () => {
  const state = readState();
  return state.tokens;
};

export const tradeToken = async ({ walletAddress, tokenId, amount, type }) => {
  if (!walletAddress || !tokenId || !amount) throw new Error('Invalid trade payload.');
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error('Amount must be positive.');
  if (!['buy', 'sell'].includes(type)) throw new Error('Trade type must be buy or sell.');

  const state = updateState((draft) => {
    initializeWallet(walletAddress, draft);
    const token = draft.tokens.find((item) => item.id === tokenId);
    if (!token) throw new Error('Token not found.');

    const tokenTrades = draft.tokenTrades.filter((tx) => tx.tokenId === tokenId);
    const price = getTokenPrice(token, tokenTrades);
    const usdValue = Number((normalizedAmount * price).toFixed(2));
    const currentHoldings = getWalletTokenBalance(walletAddress, tokenId, draft);

    if (type === 'buy' && draft.wallets[walletAddress].usdBalance < usdValue) {
      throw new Error('Insufficient USD balance.');
    }

    if (type === 'sell' && currentHoldings < normalizedAmount) {
      throw new Error('Insufficient token balance.');
    }

    draft.wallets[walletAddress].usdBalance = Number((draft.wallets[walletAddress].usdBalance + (type === 'sell' ? usdValue : -usdValue)).toFixed(2));

    draft.tokenTrades.unshift({
      id: crypto.randomUUID(),
      tokenId,
      walletAddress,
      amount: normalizedAmount,
      usdValue,
      type,
      timestamp: new Date().toISOString(),
    });

    const resultingBalance = getWalletTokenBalance(walletAddress, tokenId, draft);
    if (resultingBalance > 0 && !token.holders.includes(walletAddress)) {
      token.holders.push(walletAddress);
    }
    if (resultingBalance <= 0) {
      token.holders = token.holders.filter((address) => address !== walletAddress);
    }

    if (type === 'buy') unlockAchievement(draft, walletAddress, 'first_trade');
    if (resultingBalance >= token.supply * 0.03) unlockAchievement(draft, walletAddress, 'whale_status');

    pushActivity(draft, `token_${type}`, `${walletAddress.slice(0, 6)} ${type === 'buy' ? 'bought' : 'sold'} ${token.symbol}`, { tokenId: token.id, walletAddress });
    addNotification(draft, walletAddress, `${token.symbol} ${type}`, `${type === 'buy' ? 'Bought' : 'Sold'} ${normalizedAmount} tokens.`);
    return draft;
  });

  return state;
};

export const getMarketSnapshot = async ({ chatMessages = [] } = {}) => {
  const state = readState();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const tokens = state.tokens.map((token) => {
    const trades = state.tokenTrades.filter((tx) => tx.tokenId === token.id);
    const recentTrades = trades.filter((tx) => new Date(tx.timestamp).getTime() >= oneDayAgo);
    const recentVolume = recentTrades.reduce((acc, tx) => acc + tx.usdValue, 0);
    const price = getTokenPrice(token, trades);
    const mentions = chatMessages.filter((msg) => {
      const content = msg.content?.toLowerCase() || '';
      return content.includes(token.symbol.toLowerCase()) || content.includes(token.name.toLowerCase());
    }).length;

    const trendScore = Number((recentVolume * 0.45 + token.holders.length * 10 + recentTrades.length * 6 + mentions * 9).toFixed(2));
    const growth = Number((((recentTrades.length / Math.max(trades.length, 1)) * 100)).toFixed(2));

    return {
      ...token,
      price,
      marketCap: Number((price * token.supply).toFixed(2)),
      totalTrades: trades.length,
      recentTrades: recentTrades.length,
      recentVolume: Number(recentVolume.toFixed(2)),
      mentions,
      trendScore,
      growth,
      trendTag: trendScore > 500 ? 'Hot' : recentTrades.length > 4 ? 'Rising' : 'New',
    };
  }).sort((a, b) => b.trendScore - a.trendScore);

  const walletStats = Object.entries(state.wallets).map(([walletAddress, wallet]) => {
    const walletTrades = state.tokenTrades.filter((tx) => tx.walletAddress === walletAddress);
    const tokenValue = state.tokens.reduce((acc, token) => {
      const bal = getWalletTokenBalance(walletAddress, token.id, state);
      const tokenTrades = state.tokenTrades.filter((tx) => tx.tokenId === token.id);
      return acc + bal * getTokenPrice(token, tokenTrades);
    }, 0);

    const activityLevel = walletTrades.length * 8;
    const chatParticipation = chatMessages.filter((msg) => msg.walletAddress === walletAddress).length * 3;
    const holdings = Number(tokenValue.toFixed(2));
    const score = Math.round(activityLevel + chatParticipation + holdings / 50);
    const reputationLevel = score > 350 ? 'Whale VIP' : score > 160 ? 'Pro' : score > 60 ? 'Active' : 'Newbie';

    return {
      walletAddress,
      usdBalance: wallet.usdBalance,
      score,
      activityLevel,
      holdings,
      chatParticipation,
      reputationLevel,
      achievements: state.achievements[walletAddress] || [],
      trades: walletTrades.length,
    };
  });

  const topTraders = [...walletStats].sort((a, b) => b.trades - a.trades).slice(0, 8);
  const biggestHolders = [...walletStats].sort((a, b) => b.holdings - a.holdings).slice(0, 8);
  const mostActiveUsers = [...walletStats].sort((a, b) => b.activityLevel + b.chatParticipation - (a.activityLevel + a.chatParticipation)).slice(0, 8);

  return {
    tokens,
    leaderboards: {
      users: { topTraders, biggestHolders, mostActiveUsers },
      tokens: {
        highestMarketCap: [...tokens].sort((a, b) => b.marketCap - a.marketCap).slice(0, 8),
        fastestGrowing: [...tokens].sort((a, b) => b.growth - a.growth).slice(0, 8),
        mostTraded: [...tokens].sort((a, b) => b.totalTrades - a.totalTrades).slice(0, 8),
      },
    },
    walletStats,
    activity: state.activity.slice(0, 40),
  };
};

export const getTokenDetail = async (tokenId) => {
  const state = readState();
  const token = state.tokens.find((item) => item.id === tokenId);
  if (!token) return null;

  const trades = state.tokenTrades.filter((tx) => tx.tokenId === tokenId);
  const price = getTokenPrice(token, trades);
  const history = trades.slice(0, 20).reverse().map((tx, index) => ({
    x: index,
    y: Number((price + (index - 10) * 0.002 + (tx.type === 'buy' ? 0.003 : -0.003)).toFixed(4)),
  }));

  return {
    ...token,
    price,
    holders: token.holders,
    trades: trades.slice(0, 40),
    history,
  };
};

export const transferMockToken = async ({ fromWallet, toWallet, amount }) => {
  if (!fromWallet || !toWallet || !amount || amount <= 0) {
    throw new Error('Invalid transfer payload.');
  }

  const nextState = updateState((draft) => {
    initializeWallet(fromWallet, draft);
    initializeWallet(toWallet, draft);

    if (draft.wallets[fromWallet].snl1Balance < amount) {
      throw new Error('Insufficient SNL1 balance.');
    }

    draft.wallets[fromWallet].snl1Balance = Number((draft.wallets[fromWallet].snl1Balance - amount).toFixed(2));
    draft.wallets[toWallet].snl1Balance = Number((draft.wallets[toWallet].snl1Balance + amount).toFixed(2));
    draft.transfers.unshift({
      id: crypto.randomUUID(),
      fromWallet,
      toWallet,
      amount,
      timestamp: new Date().toISOString(),
    });

    return draft;
  });

  return {
    from: nextState.wallets[fromWallet],
    to: nextState.wallets[toWallet],
  };
};

export const createShareLink = async ({ tokenId, walletAddress }) => {
  const state = updateState((draft) => {
    if (!draft.shareVisits[tokenId]) draft.shareVisits[tokenId] = [];
    draft.shareVisits[tokenId].push({ walletAddress, timestamp: new Date().toISOString() });
    return draft;
  });
  return `${window.location.origin}/?token=${tokenId}&ref=${walletAddress}`;
};

export const registerReferralJoin = async ({ tokenId, referrer }) => {
  updateState((draft) => {
    const key = `${tokenId}:${referrer}`;
    draft.referrals[key] = (draft.referrals[key] || 0) + 1;
    return draft;
  });
};

export const getReferralCount = async ({ tokenId, referrer }) => {
  const state = readState();
  return state.referrals[`${tokenId}:${referrer}`] || 0;
};

export const getNotifications = async (walletAddress) => {
  const state = readState();
  return state.notifications[walletAddress] || [];
};
