import { readState, updateState } from './stateStore';

const PLATFORM_FEE_RATE = 0.02;
const DEFAULT_BASE_PRICE = 0.01;
const DEFAULT_CURVE_K = 0.0001;
const PRICE_DECIMALS = 6;

// --- YARDIMCI FONKSİYONLAR ---
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

// --- CORE LOGIC (BONDING CURVE & SOCIAL) ---

const getCurvePrice = (basePrice, curveK, supply) => round(basePrice + curveK * supply, PRICE_DECIMALS);

const computeBuyGrossCost = ({ basePrice, curveK, currentSupply, amount }) => {
  const supplyComponent = amount * currentSupply + ((amount - 1) * amount) / 2;
  return round(amount * basePrice + curveK * supplyComponent, PRICE_DECIMALS);
};

const computeSellGrossPayout = ({ basePrice, curveK, currentSupply, amount }) => {
  const supplyComponent = amount * (currentSupply - 1) - ((amount - 1) * amount) / 2;
  return round(amount * basePrice + curveK * supplyComponent, PRICE_DECIMALS);
};

const buildTokenAddress = (symbol) => `mock_${symbol.toLowerCase()}_${crypto.randomUUID().slice(0, 8)}`;

const getHolderCount = (wallets, tokenAddress) =>
  Object.values(wallets).filter((wallet) => (wallet.tokenBalances?.[tokenAddress] || 0) > 0).length;

const mapTokenToMarketData = (token, wallets) => {
  const currentPrice = getCurvePrice(token.basePrice, token.curveK, token.circulatingSupply);
  const marketCap = round(currentPrice * token.circulatingSupply, 6);

  return {
    ...token,
    currentPrice,
    marketCap,
    holdersCount: getHolderCount(wallets, token.tokenAddress), // main dalındaki holders dizisiyle çakışmaması için isimlendirme güncellendi
    platformFeeRate: PLATFORM_FEE_RATE,
  };
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

// --- EXPORTED ACTIONS ---

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
    
    // Token bakiyesini ekle
    draft.wallets[token.creatorWallet].tokenBalances[tokenAddress] =
      (draft.wallets[token.creatorWallet].tokenBalances[tokenAddress] || 0) + supply;

    // Sosyal özellikleri tetikle
    unlockAchievement(draft, token.creatorWallet, 'first_token_created');
    pushActivity(draft, 'token_created', `${token.creatorWallet.slice(0, 6)} created ${token.symbol}`, { tokenId: token.id });
    addNotification(draft, token.creatorWallet, 'Token launched', `${token.name} is now live.`);
    return draft;
  });

  return token;
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

    // Bakiyeleri güncelle
    draft.wallets[walletAddress].snl1Balance = round(draft.wallets[walletAddress].snl1Balance - totalCost, PRICE_DECIMALS);
    draft.wallets[walletAddress].tokenBalances[tokenAddress] = (draft.wallets[walletAddress].tokenBalances[tokenAddress] || 0) + amount;

    // Token verilerini güncelle
    token.circulatingSupply += amount;
    token.reserveBalance = round(token.reserveBalance + grossCost, PRICE_DECIMALS);
    draft.treasury.snl1FeesCollected = round(draft.treasury.snl1FeesCollected + fee, PRICE_DECIMALS);

    if (!token.holders.includes(walletAddress)) token.holders.push(walletAddress);

    // Kayıtlar ve Sosyal
    draft.trades.unshift({
      id: crypto.randomUUID(),
      tokenAddress,
      walletAddress,
      side: 'buy',
      amount,
