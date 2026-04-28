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

const pseudoAddress = (seed) => {
  const normalized = Array.from(seed)
    .reduce((acc, character, index) => (acc + character.charCodeAt(0) * (index + 17)).toString(16), '');
  return `0x${normalized.padEnd(40, '0').slice(0, 40)}`;
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

const validateCreateTokenPayload = ({ tokenName, symbol, supply }) => {
  if (!tokenName?.trim()) throw new Error('Token name is required.');
  if (!symbol?.trim()) throw new Error('Token symbol is required.');
  if (symbol.length > 12) throw new Error('Token symbol must be 12 characters or fewer.');

  const numericSupply = Number(supply);
  if (!Number.isFinite(numericSupply) || numericSupply <= 0) {
    throw new Error('Supply must be a positive number.');
  }
};

export const createMockToken = async ({
  walletAddress,
  tokenName,
  symbol,
  supply,
  metadataURI = '',
  imageURI = '',
}) => {
  validateCreateTokenPayload({ tokenName, symbol, supply });

  await new Promise((resolve) => setTimeout(resolve, 700));

  const id = `${Date.now()}-${symbol.toUpperCase()}`;
  const tokenAddress = pseudoAddress(`${walletAddress}-${id}-${tokenName}`);
  const createdAt = new Date().toISOString();

  const item = {
    id,
    tokenAddress,
    creator: walletAddress,
    tokenName: tokenName.trim(),
    symbol: symbol.trim().toUpperCase(),
    supply: Number(supply),
    metadataURI: metadataURI.trim(),
    imageURI: imageURI.trim(),
    status: 'simulated_success',
    createdAt,
  };

  mockCreatedTokens.unshift(item);
  return item;
};

export const getMockCreatedTokens = async (walletAddress) => {
  await new Promise((resolve) => setTimeout(resolve, 160));
  return mockCreatedTokens.filter((token) => token.creator === walletAddress);
};

export const getAllMockCreatedTokens = async () => {
  await new Promise((resolve) => setTimeout(resolve, 160));
  return [...mockCreatedTokens];
};
