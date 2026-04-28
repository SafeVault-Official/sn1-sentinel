const scoreAddress = (address = '') =>
  address
    .toLowerCase()
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

const seededRange = (seed, min, max) => min + (seed % (max - min + 1));

export const getMockTokenBalance = async ({ walletAddress, tokenSymbol }) => {
  const score = scoreAddress(walletAddress);
  if (!walletAddress || !tokenSymbol) return 0;

  if (tokenSymbol.toUpperCase() === 'SNL1') {
    return seededRange(score, 200, 120_000);
  }

  const tokenSeed = tokenSymbol
    .toUpperCase()
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return seededRange(score + tokenSeed, 0, 5_000);
};

export const canAccessRoom = async ({ walletAddress, room }) => {
  if (!room?.requirements) return { allowed: true, balance: null };

  const { tokenSymbol, minBalance } = room.requirements;
  const balance = await getMockTokenBalance({ walletAddress, tokenSymbol });

  if (balance < minBalance) {
    return {
      allowed: false,
      balance,
      reason: `Need ${minBalance.toLocaleString()} ${tokenSymbol} (wallet has ${balance.toLocaleString()}).`,
    };
  }

  return { allowed: true, balance };
};
