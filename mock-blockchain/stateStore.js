const STORAGE_KEY = 'sn1.mockchain.state.v2';

const defaultState = {
  wallets: {},
  tokens: [],
  transfers: [],
  trades: [],
  treasury: {
    snl1FeesCollected: 0,
  },
};

const normalizeState = (raw = {}) => ({
  ...structuredClone(defaultState),
  ...raw,
  treasury: {
    ...defaultState.treasury,
    ...(raw?.treasury || {}),
  },
});

export const readState = () => {
  if (typeof window === 'undefined') {
    return structuredClone(defaultState);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to parse mock-chain state:', error);
    return structuredClone(defaultState);
  }
};

export const writeState = (nextState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
};

export const updateState = (updater) => {
  const current = readState();
  const updated = updater(current);
  writeState(updated);
  return updated;
};
