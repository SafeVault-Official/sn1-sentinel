const STORAGE_KEY = 'sn1.mockchain.state.v1';

const defaultState = {
  wallets: {},
  tokens: [],
  transfers: [],
  tokenTrades: [],
  shareVisits: {},
  referrals: {},
  achievements: {},
  activity: [],
  notifications: {},
};

const ensureShape = (state) => ({
  ...structuredClone(defaultState),
  ...state,
});

export const readState = () => {
  if (typeof window === 'undefined') {
    return structuredClone(defaultState);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    return ensureShape(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to parse mock-chain state:', error);
    return structuredClone(defaultState);
  }
};

export const writeState = (nextState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent('sn1:state-updated'));
};

export const updateState = (updater) => {
  const current = readState();
  const updated = ensureShape(updater(current));
  writeState(updated);
  return updated;
};
