import { readState, updateState } from './stateStore';

const PLATFORM_FEE_RATE = 0.02;
const DEFAULT_BASE_PRICE = 0.01;
const DEFAULT_CURVE_K = 0.0001;
const PRICE_DECIMALS = 6;

const round = (value, decimals = 2) => Number(value.toFixed(decimals));
const randomFloat = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));

const assertAddress = (walletAddress) => {
  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new Error('Invalid wallet address.');
  }
};

const assertPositiveInt = (amount, label = 'Amount') => {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error(`${label} must be a positive integer.`);
  }
};

const assertPositiveNumber = (amount, label = 'Amount') => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
};

const buildTokenAddress = (symbol) => `mock_${String(symbol || 'token').toLowerCase()}_${crypto.randomUUID().slice(0, 8)}`;

const initializeWallet = (walletAddress, state) => {
  assertAddress(walletAddress);
  if (!state.wallets[walletAddress]) {
    state.wallets[walletAddress] = {
      usdBalance: randomFloat(2, 1600),
      snl1Balance: randomFloat(1000, 250000),
      tokenBalances: {},
      createdAt: new Date().toISOString(),
    };
  }
  if (!state.wallets[walletAddress].tokenBalances) {
    state.wallets[walletAddress].tokenBalances = {};
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

const unlockAchievement = (draft, walletAddress, key) => {
  if (!walletAddress) return;
  if (!draft.achievements[walletAddress]) draft.achievements[walletAddress] = [];
  if (draft.achievements[walletAddress].includes(key)) return;
  draft.achievements[walletAddress].push(key);
};

const getCurvePrice = (basePrice, curveK, supply) => round(basePrice + curveK * supply, PRICE_DECIMALS);

const computeBuyGrossCost = ({ basePrice, curveK, currentSupply, amount }) => {
  const supplyComponent = amount * currentSupply + ((amount - 1) * amount) / 2;
  return round(amount * basePrice + curveK * supplyComponent, PRICE_DECIMALS);
};

const computeSellGrossPayout = ({ basePrice, curveK, currentSupply, amount }) => {
  const supplyComponent = amount * (currentSupply - 1) - ((amount - 1) * amount) / 2;
  return round(amount * basePrice + curveK * supplyComponent, PRICE_DECIMALS);
};

const getLegacyTokenPrice = (token, trades) => {
  const baseSupply = token.initialSupply || token.supply || token.circulatingSupply || 0;
  const supplyFactor = Math.max(1, baseSupply / 10000);
  const tradeImpact = trades.reduce((acc, tx) => acc + (tx.type === 'buy' ? tx.amount : -tx.amount), 0) / 5000;
  return Number((0.03 + supplyFactor * 0.002 + tradeImpact).toFixed(4));
};

const getTokenPrice = (token, state) => {
  if (Number.isFinite(token.basePrice) && Number.isFinite(token.curveK) && Number.isFinite(token.circulatingSupply)) {
    return getCurvePrice(token.basePrice, token.curveK, token.circulatingSupply);
  }

  const key = token.id || token.tokenAddress;
  const trades = state.tokenTrades.filter((tx) => tx.tokenId === key);
  return getLegacyTokenPrice(token, trades);
};

const getHolderCount = (wallets, tokenAddress) =>
  Object.values(wallets).filter((wallet) => (wallet.tokenBalances?.[tokenAddress] || 0) > 0).length;

const getWalletTokenBalance = (walletAddress, token, state) => {
  const byAddress = state.wallets[walletAddress]?.tokenBalances?.[token.tokenAddress] || 0;
  if (byAddress > 0) return byAddress;

  const key = token.id || token.tokenAddress;
  return state.tokenTrades
    .filter((tx) => tx.walletAddress === walletAddress && tx.tokenId === key)
    .reduce((acc, tx) => acc + (tx.type === 'buy' ? tx.amount : -tx.amount), 0);
};

const mapTokenToMarketData = (token, state) => {
  const currentPrice = getTokenPrice(token, state);
  const supply = token.circulatingSupply ?? token.supply ?? token.initialSupply ?? 0;
  const marketCap = round(currentPrice * supply, 6);
  const holders = token.tokenAddress ? getHolderCount(state.wallets, token.tokenAddress) : token.holders?.length || 0;

  return {
    ...token,
    currentPrice,
    price: currentPrice,
    marketCap,
    holdersCount: holders,
    platformFeeRate: PLATFORM_FEE_RATE,
  };
};

export const getBalance = async (walletAddress) => {
  const state = updateState((draft) => initializeWallet(walletAddress, draft));
  return state.wallets[walletAddress];
};

export const createToken = async (tokenPayload) => {
  const supply = Number(tokenPayload?.supply);
  const basePrice = Number(tokenPayload?.basePrice ?? DEFAULT_BASE_PRICE);
  const curveK = Number(tokenPayload?.curveK ?? DEFAULT_CURVE_K);

  assertAddress(tokenPayload?.creatorWallet);
  assertPositiveInt(supply, 'Initial supply');

  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new Error('Base price must be greater than 0.');
  if (!Number.isFinite(curveK) || curveK <= 0) throw new Error('Curve growth factor must be greater than 0.');

  const tokenAddress = buildTokenAddress(tokenPayload.symbol || 'token');
  const timestamp = new Date().toISOString();

  const token = {
    id: crypto.randomUUID(),
    ...tokenPayload,
    tokenAddress,
    name: tokenPayload.name,
    symbol: String(tokenPayload.symbol || '').toUpperCase(),
    logo: tokenPayload.logo || '',
    creatorWallet: tokenPayload.creatorWallet,
    supply,
    initialSupply: supply,
    circulatingSupply: supply,
    basePrice: round(basePrice, PRICE_DECIMALS),
    curveK: round(curveK, PRICE_DECIMALS),
    reserveBalance: round(basePrice * supply, PRICE_DECIMALS),
    holders: [tokenPayload.creatorWallet],
    createdAt: timestamp,
    timestamp,
  };

  updateState((draft) => {
    initializeWallet(token.creatorWallet, draft);
    draft.tokens.unshift(token);
    draft.wallets[token.creatorWallet].tokenBalances[tokenAddress] =
      (draft.wallets[token.creatorWallet].tokenBalances[tokenAddress] || 0) + supply;

    draft.tokenTrades.unshift({
      id: crypto.randomUUID(),
      tokenId: token.id,
      walletAddress: token.creatorWallet,
      amount: Math.max(1, Math.round(supply * 0.05)),
      usdValue: Number((supply * 0.004).toFixed(2)),
      type: 'buy',
      timestamp,
    });

    unlockAchievement(draft, token.creatorWallet, 'first_token_created');
    pushActivity(draft, 'token_created', `${token.creatorWallet.slice(0, 6)} created ${token.symbol}`, { tokenId: token.id, tokenAddress });
    addNotification(draft, token.creatorWallet, 'Token launched', `${token.name} is now live.`);
    return draft;
  });

  return token;
};

export const getTokens = async (walletAddress) => {
  const state = readState();
  return state.tokens
    .filter((token) => token.creatorWallet === walletAddress)
    .map((token) => mapTokenToMarketData(token, state));
};

export const getAllTokens = async () => {
  const state = readState();
  return state.tokens.map((token) => mapTokenToMarketData(token, state));
};

export const getTradableTokens = async () => {
  const state = readState();
  return state.tokens.map((token) => mapTokenToMarketData(token, state));
};

export const buyToken = async ({ tokenAddress, walletAddress, amount }) => {
  assertAddress(walletAddress);
  assertAddress(tokenAddress);
  assertPositiveInt(amount);

  const nextState = updateState((draft) => {
    initializeWallet(walletAddress, draft);

    const token = draft.tokens.find((item) => item.tokenAddress === tokenAddress);
    if (!token) throw new Error('Token not found.');

    const grossCost = computeBuyGrossCost({
      basePrice: token.basePrice,
      curveK: token.curveK,
      currentSupply: token.circulatingSupply,
      amount,
    });

    const fee = round(grossCost * PLATFORM_FEE_RATE, PRICE_DECIMALS);
    const totalCost = round(grossCost + fee, PRICE_DECIMALS);

    if (draft.wallets[walletAddress].snl1Balance < totalCost) {
      throw new Error('Insufficient SNL1 balance.');
    }

    draft.wallets[walletAddress].snl1Balance = round(draft.wallets[walletAddress].snl1Balance - totalCost, PRICE_DECIMALS);
    draft.wallets[walletAddress].tokenBalances[tokenAddress] = (draft.wallets[walletAddress].tokenBalances[tokenAddress] || 0) + amount;

    token.circulatingSupply += amount;
    token.reserveBalance = round(token.reserveBalance + grossCost, PRICE_DECIMALS);
    draft.treasury.snl1FeesCollected = round(draft.treasury.snl1FeesCollected + fee, PRICE_DECIMALS);

    if (!token.holders.includes(walletAddress)) token.holders.push(walletAddress);

    draft.trades.unshift({
      id: crypto.randomUUID(),
      tokenAddress,
      tokenId: token.id,
      walletAddress,
      side: 'buy',
      amount,
      grossCost,
      fee,
      totalCost,
      timestamp: new Date().toISOString(),
    });

    draft.tokenTrades.unshift({
      id: crypto.randomUUID(),
      tokenId: token.id,
      walletAddress,
      amount,
      usdValue: grossCost,
      type: 'buy',
      timestamp: new Date().toISOString(),
    });

    unlockAchievement(draft, walletAddress, 'first_trade');
    if ((draft.wallets[walletAddress].tokenBalances[tokenAddress] || 0) >= token.initialSupply * 0.03) {
      unlockAchievement(draft, walletAddress, 'whale_status');
    }

    pushActivity(draft, 'token_buy', `${walletAddress.slice(0, 6)} bought ${token.symbol}`, { tokenId: token.id, tokenAddress, walletAddress });
    addNotification(draft, walletAddress, `${token.symbol} buy`, `Bought ${amount} tokens.`);

    return draft;
  });

  const token = nextState.tokens.find((item) => item.tokenAddress === tokenAddress);
  return {
    token: mapTokenToMarketData(token, nextState),
    wallet: nextState.wallets[walletAddress],
    treasury: nextState.treasury,
  };
};

export const sellToken = async ({ tokenAddress, walletAddress, amount }) => {
  assertAddress(walletAddress);
  assertAddress(tokenAddress);
  assertPositiveInt(amount);

  const nextState = updateState((draft) => {
    initializeWallet(walletAddress, draft);

    const token = draft.tokens.find((item) => item.tokenAddress === tokenAddress);
    if (!token) throw new Error('Token not found.');

    const walletTokens = draft.wallets[walletAddress].tokenBalances[tokenAddress] || 0;
    if (walletTokens < amount) throw new Error('Insufficient token balance to sell.');
    if (token.circulatingSupply - amount < 0) throw new Error('Sell amount exceeds circulating supply.');

    const grossPayout = computeSellGrossPayout({
      basePrice: token.basePrice,
      curveK: token.curveK,
      currentSupply: token.circulatingSupply,
      amount,
    });

    if (token.reserveBalance < grossPayout) throw new Error('Insufficient reserve liquidity.');

    const fee = round(grossPayout * PLATFORM_FEE_RATE, PRICE_DECIMALS);
    const netPayout = round(grossPayout - fee, PRICE_DECIMALS);

    draft.wallets[walletAddress].tokenBalances[tokenAddress] = walletTokens - amount;
    draft.wallets[walletAddress].snl1Balance = round(draft.wallets[walletAddress].snl1Balance + netPayout, PRICE_DECIMALS);

    token.circulatingSupply -= amount;
    token.reserveBalance = round(token.reserveBalance - grossPayout, PRICE_DECIMALS);
    draft.treasury.snl1FeesCollected = round(draft.treasury.snl1FeesCollected + fee, PRICE_DECIMALS);

    if ((draft.wallets[walletAddress].tokenBalances[tokenAddress] || 0) <= 0) {
      token.holders = token.holders.filter((address) => address !== walletAddress);
    }

    draft.trades.unshift({
      id: crypto.randomUUID(),
      tokenAddress,
      tokenId: token.id,
      walletAddress,
      side: 'sell',
      amount,
      grossPayout,
      fee,
      netPayout,
      timestamp: new Date().toISOString(),
    });

    draft.tokenTrades.unshift({
      id: crypto.randomUUID(),
      tokenId: token.id,
      walletAddress,
      amount,
      usdValue: grossPayout,
      type: 'sell',
      timestamp: new Date().toISOString(),
    });

    pushActivity(draft, 'token_sell', `${walletAddress.slice(0, 6)} sold ${token.symbol}`, { tokenId: token.id, tokenAddress, walletAddress });
    addNotification(draft, walletAddress, `${token.symbol} sell`, `Sold ${amount} tokens.`);

    return draft;
  });

  const token = nextState.tokens.find((item) => item.tokenAddress === tokenAddress);
  return {
    token: mapTokenToMarketData(token, nextState),
    wallet: nextState.wallets[walletAddress],
    treasury: nextState.treasury,
  };
};

export const tradeToken = async ({ walletAddress, tokenId, amount, type }) => {
  assertAddress(walletAddress);
  assertPositiveNumber(Number(amount));
  if (!['buy', 'sell'].includes(type)) throw new Error('Trade type must be buy or sell.');

  const state = readState();
  const token = state.tokens.find((item) => item.id === tokenId || item.tokenAddress === tokenId);
  if (!token) throw new Error('Token not found.');

  if (!token.tokenAddress) {
    throw new Error('Token is not tradable via bonding curve.');
  }

  const normalizedAmount = Math.max(1, Math.round(Number(amount)));
  return type === 'buy'
    ? buyToken({ tokenAddress: token.tokenAddress, walletAddress, amount: normalizedAmount })
    : sellToken({ tokenAddress: token.tokenAddress, walletAddress, amount: normalizedAmount });
};

export const getMarketSnapshot = async ({ chatMessages = [] } = {}) => {
  const state = readState();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const tokens = state.tokens
    .map((token) => {
      const trades = state.tokenTrades.filter((tx) => tx.tokenId === token.id || tx.tokenId === token.tokenAddress);
      const recentTrades = trades.filter((tx) => new Date(tx.timestamp).getTime() >= oneDayAgo);
      const recentVolume = recentTrades.reduce((acc, tx) => acc + (tx.usdValue || 0), 0);
      const price = getTokenPrice(token, state);
      const mentions = chatMessages.filter((msg) => {
        const content = msg.content?.toLowerCase() || '';
        return content.includes((token.symbol || '').toLowerCase()) || content.includes((token.name || '').toLowerCase());
      }).length;

      const holders = token.tokenAddress ? getHolderCount(state.wallets, token.tokenAddress) : token.holders?.length || 0;
      const supply = token.circulatingSupply ?? token.supply ?? token.initialSupply ?? 0;
      const trendScore = Number((recentVolume * 0.45 + holders * 10 + recentTrades.length * 6 + mentions * 9).toFixed(2));
      const growth = Number(((recentTrades.length / Math.max(trades.length, 1)) * 100).toFixed(2));

      return {
        ...token,
        price,
        marketCap: Number((price * supply).toFixed(2)),
        totalTrades: trades.length,
        recentTrades: recentTrades.length,
        recentVolume: Number(recentVolume.toFixed(2)),
        mentions,
        trendScore,
        growth,
        trendTag: trendScore > 500 ? 'Hot' : recentTrades.length > 4 ? 'Rising' : 'New',
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore);

  const walletStats = Object.entries(state.wallets).map(([walletAddress, wallet]) => {
    const walletTrades = state.tokenTrades.filter((tx) => tx.walletAddress === walletAddress);
    const tokenValue = state.tokens.reduce((acc, token) => {
      const bal = getWalletTokenBalance(walletAddress, token, state);
      return acc + bal * getTokenPrice(token, state);
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
  const mostActiveUsers = [...walletStats]
    .sort((a, b) => b.activityLevel + b.chatParticipation - (a.activityLevel + a.chatParticipation))
    .slice(0, 8);

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
  const token = state.tokens.find((item) => item.id === tokenId || item.tokenAddress === tokenId);
  if (!token) return null;

  const trades = state.tokenTrades.filter((tx) => tx.tokenId === token.id || tx.tokenId === token.tokenAddress).slice(0, 40);
  const price = getTokenPrice(token, state);
  const history = trades.slice(0, 20).reverse().map((tx, index) => ({
    x: index,
    y: Number((price + (index - 10) * 0.002 + (tx.type === 'buy' ? 0.003 : -0.003)).toFixed(4)),
  }));

  return {
    ...token,
    price,
    holders: token.holders || [],
    trades,
    history,
  };
};

export const transferMockToken = async ({ fromWallet, toWallet, amount }) => {
  assertAddress(fromWallet);
  assertAddress(toWallet);
  assertPositiveNumber(Number(amount));

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

export const getTreasurySnapshot = async () => readState().treasury;

export const createShareLink = async ({ tokenId, walletAddress }) => {
  updateState((draft) => {
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
