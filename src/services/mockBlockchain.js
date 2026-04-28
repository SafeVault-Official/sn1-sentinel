/**
 * Mock blockchain read/write layer.
 * Replace implementations here with real viem/ethers contract reads later.
 */

const mockWalletState = new Map();
const mockCreatedTokens = [];

const hashAddress = (address = '') =>
  address
    .toLowerCase()
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

const getSeededNumber = (address, min, max) => {
  const hash = hashAddress(address);
  return min + (hash % (max - min + 1));
};

export const getMockWalletSnapshot = async (walletAddress) => {
  if (!walletAddress) {
    return { usdBalance: 0, snl1Balance: 0 };
  }

  if (!mockWalletState.has(walletAddress)) {
    const usdBalance = getSeededNumber(walletAddress, 2, 3200) + Math.random();
    const snl1Balance = getSeededNumber(walletAddress, 120, 120_000);
    mockWalletState.set(walletAddress, {
      usdBalance: Number(usdBalance.toFixed(2)),
      snl1Balance,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 280));
  return mockWalletState.get(walletAddress);
};

export const createMockToken = async ({ walletAddress, tokenName, symbol, supply }) => {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const item = {
    id: `${Date.now()}-${symbol}`,
    walletAddress,
    tokenName,
    symbol: symbol.toUpperCase(),
    supply: Number(supply),
    status: 'simulated_success',
    createdAt: new Date().toISOString(),
  };

  mockCreatedTokens.unshift(item);
  return item;
};

export const getMockCreatedTokens = async (walletAddress) => {
  await new Promise((resolve) => setTimeout(resolve, 160));
  return mockCreatedTokens.filter((token) => token.walletAddress === walletAddress);
};
