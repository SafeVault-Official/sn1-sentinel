const STORAGE_KEY = 'sn1.web3.foundation.state.v1';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultState = {
  wallets: {},
  transactions: [],
};

const readState = () => {
  if (typeof window === 'undefined') return structuredClone(defaultState);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
};

const writeState = (nextState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
};

const updateState = (updater) => {
  const current = readState();
  const nextState = updater(current);
  writeState(nextState);
  return nextState;
};

const hashAddress = (address = '') =>
  address
    .toLowerCase()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const initializeWallet = (walletAddress, state) => {
  if (!walletAddress) return;
  if (state.wallets[walletAddress]) return;

  const seed = hashAddress(walletAddress);
  const usdBalance = Number((50 + (seed % 2000) + Math.random()).toFixed(2));
  const snl1Balance = Number((1000 + (seed % 100000)).toFixed(2));

  state.wallets[walletAddress] = {
    usdBalance,
    snl1Balance,
    updatedAt: new Date().toISOString(),
  };
};

const txStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
};

export class MockBlockchainProvider {
  network = 'mock';

  async getBalance(walletAddress) {
    if (!walletAddress) {
      return { usdBalance: 0, snl1Balance: 0 };
    }

    await delay(120);
    const state = updateState((draft) => {
      initializeWallet(walletAddress, draft);
      return draft;
    });

    return state.wallets[walletAddress];
  }

  async createTransaction(data) {
    await delay(80);

    const tx = {
      id: crypto.randomUUID(),
      hash: `0x${crypto.randomUUID().replaceAll('-', '')}`,
      status: txStatus.PENDING,
      createdAt: new Date().toISOString(),
      ...data,
    };

    updateState((draft) => {
      draft.transactions.unshift(tx);
      return draft;
    });

    return tx;
  }

  async transferToken(from, to, amount) {
    if (!from || !to) {
      throw new Error('Both sender and receiver are required.');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Transfer amount must be a positive number.');
    }

    const pendingTx = await this.createTransaction({ type: 'snl1_transfer', from, to, amount });
    await delay(250);

    try {
      const state = updateState((draft) => {
        initializeWallet(from, draft);
        initializeWallet(to, draft);

        if (draft.wallets[from].snl1Balance < amount) {
          throw new Error('Insufficient SNL1 balance.');
        }

        draft.wallets[from].snl1Balance = Number((draft.wallets[from].snl1Balance - amount).toFixed(2));
        draft.wallets[to].snl1Balance = Number((draft.wallets[to].snl1Balance + amount).toFixed(2));

        const target = draft.transactions.find((tx) => tx.id === pendingTx.id);
        if (target) {
          target.status = txStatus.CONFIRMED;
          target.confirmedAt = new Date().toISOString();
        }

        return draft;
      });

      return {
        transaction: { ...pendingTx, status: txStatus.CONFIRMED },
        balances: {
          from: state.wallets[from],
          to: state.wallets[to],
        },
      };
    } catch (error) {
      updateState((draft) => {
        const target = draft.transactions.find((tx) => tx.id === pendingTx.id);
        if (target) {
          target.status = txStatus.FAILED;
          target.error = error.message;
          target.failedAt = new Date().toISOString();
        }
        return draft;
      });
      throw error;
    }
  }

  async getTransactionHistory(walletAddress) {
    if (!walletAddress) return [];

    await delay(100);
    const state = readState();
    return state.transactions.filter((tx) => tx.from === walletAddress || tx.to === walletAddress);
  }
}
