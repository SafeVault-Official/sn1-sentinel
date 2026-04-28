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
    holders: getHolderCount(wallets, token.tokenAddress),
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

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error('Base price must be greater than 0.');
  }

  if (!Number.isFinite(curveK) || curveK <= 0) {
    throw new Error('Curve growth factor must be greater than 0.');
  }

  const tokenAddress = buildTokenAddress(tokenPayload.symbol || 'token');
  const timestamp = new Date().toISOString();

  const token = {
    id: crypto.randomUUID(),
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
    createdAt: timestamp,
    timestamp,
  };

  updateState((draft) => {
    initializeWallet(token.creatorWallet, draft);
    draft.tokens.unshift(token);
    draft.wallets[token.creatorWallet].tokenBalances[tokenAddress] =
      (draft.wallets[token.creatorWallet].tokenBalances[tokenAddress] || 0) + supply;
    return draft;
  });

  return token;
};

export const getTokens = async (walletAddress) => {
  const state = readState();
  return state.tokens.filter((token) => token.creatorWallet === walletAddress).map((token) => mapTokenToMarketData(token, state.wallets));
};

export const getTradableTokens = async () => {
  const state = readState();
  return state.tokens.map((token) => mapTokenToMarketData(token, state.wallets));
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
      throw new Error('Insufficient SNL1 balance for buy + fee.');
    }

    draft.wallets[walletAddress].snl1Balance = round(draft.wallets[walletAddress].snl1Balance - totalCost, PRICE_DECIMALS);
    draft.wallets[walletAddress].tokenBalances[tokenAddress] =
      (draft.wallets[walletAddress].tokenBalances[tokenAddress] || 0) + amount;

    token.circulatingSupply += amount;
    token.reserveBalance = round(token.reserveBalance + grossCost, PRICE_DECIMALS);
    draft.treasury.snl1FeesCollected = round(draft.treasury.snl1FeesCollected + fee, PRICE_DECIMALS);

    draft.trades.unshift({
      id: crypto.randomUUID(),
      tokenAddress,
      walletAddress,
      side: 'buy',
      amount,
      grossCost,
      fee,
      totalCost,
      timestamp: new Date().toISOString(),
    });

    return draft;
  });

  const token = nextState.tokens.find((item) => item.tokenAddress === tokenAddress);
  return {
    token: mapTokenToMarketData(token, nextState.wallets),
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
    if (walletTokens < amount) {
      throw new Error('Insufficient token balance to sell.');
    }

    if (token.circulatingSupply - amount < 0) {
      throw new Error('Sell amount exceeds circulating supply.');
    }

    const grossPayout = computeSellGrossPayout({
      basePrice: token.basePrice,
      curveK: token.curveK,
      currentSupply: token.circulatingSupply,
      amount,
    });

    if (token.reserveBalance < grossPayout) {
      throw new Error('Insufficient reserve liquidity.');
    }

    const fee = round(grossPayout * PLATFORM_FEE_RATE, PRICE_DECIMALS);
    const netPayout = round(grossPayout - fee, PRICE_DECIMALS);

    draft.wallets[walletAddress].tokenBalances[tokenAddress] = walletTokens - amount;
    draft.wallets[walletAddress].snl1Balance = round(draft.wallets[walletAddress].snl1Balance + netPayout, PRICE_DECIMALS);

    token.circulatingSupply -= amount;
    token.reserveBalance = round(token.reserveBalance - grossPayout, PRICE_DECIMALS);
    draft.treasury.snl1FeesCollected = round(draft.treasury.snl1FeesCollected + fee, PRICE_DECIMALS);

    draft.trades.unshift({
      id: crypto.randomUUID(),
      tokenAddress,
      walletAddress,
      side: 'sell',
      amount,
      grossPayout,
      fee,
      netPayout,
      timestamp: new Date().toISOString(),
    });

    return draft;
  });

  const token = nextState.tokens.find((item) => item.tokenAddress === tokenAddress);
  return {
    token: mapTokenToMarketData(token, nextState.wallets),
    wallet: nextState.wallets[walletAddress],
    treasury: nextState.treasury,
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

export const getTreasurySnapshot = async () => readState().treasury;
