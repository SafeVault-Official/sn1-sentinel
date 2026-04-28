import { resolveAvatarFromUsd } from '../nft/avatarEngine';

export const buildWalletProfile = ({ address, walletType, balance }) => {
  const avatar = resolveAvatarFromUsd(balance.usdBalance || 0);
  return {
    address,
    walletType,
    avatar,
    stats: {
      usdBalance: balance.usdBalance || 0,
      snl1Balance: balance.snl1Balance || 0,
    },
  };
};

export const shortWallet = (address = '') => {
  if (!address) return 'Guest';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
