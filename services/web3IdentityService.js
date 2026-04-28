import { buildWalletProfile } from '../auth/profileService';
import { getWalletCreatedTokens } from '../factory/tokenFactoryService';

export const getDashboardSnapshot = async (session) => {
  if (!session?.address) {
    return {
      profile: null,
      tokens: [],
      walletActivity: { chatMessages: 0 },
    };
  }

  const profile = buildWalletProfile({
    address: session.address,
    walletType: session.walletType,
    balance: session.balance,
  });

  const tokens = await getWalletCreatedTokens(session.address);

  return {
    profile,
    tokens,
    walletActivity: {
      chatMessages: 0,
    },
  };
};
