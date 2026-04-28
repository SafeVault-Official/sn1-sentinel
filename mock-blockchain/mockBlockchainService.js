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

export const getBalance = async (walletAddress) => {
  const state = updateState((draft) => initializeWallet(walletAddress, draft));
  return state.wallets[walletAddress];
};

export const createToken = async (tokenPayload) => {
  const token = {
    id: crypto.randomUUID(),
    ...tokenPayload,
    timestamp: new Date().toISOString(),
  };

  updateState((draft) => {
    initializeWallet(token.creatorWallet, draft);
    draft.tokens.unshift(token);
    return draft;
  });

  return token;
};

export const getTokens = async (walletAddress) => {
  const state = readState();
  return state.tokens.filter((token) => token.creatorWallet === walletAddress);
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
