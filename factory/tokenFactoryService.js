import {
  createToken,
  createShareLink,
  getAllTokens,
  getMarketSnapshot,
  getNotifications,
  getReferralCount,
  getTokenDetail,
  getTokens,
  registerReferralJoin,
  tradeToken,
} from '../mock-blockchain/mockBlockchainService';

export const tokenFactoryPlaceholder = {
  contractName: 'SNL1TokenFactory',
  contractAddress: '0x0000000000000000000000000000000000000000',
  createTokenMethod: 'createToken(string name, string symbol, uint256 totalSupply, string metadataURI)',
};

export const createLaunchpadToken = async (payload) => createToken(payload);
export const getWalletCreatedTokens = async (walletAddress) => getTokens(walletAddress);
export const getAllLaunchpadTokens = async () => getAllTokens();
export const tradeLaunchpadToken = async (payload) => tradeToken(payload);
export const getGrowthSnapshot = async (payload) => getMarketSnapshot(payload);
export const getLaunchpadTokenDetail = async (tokenId) => getTokenDetail(tokenId);
export const getTokenShareLink = async (payload) => createShareLink(payload);
export const registerReferral = async (payload) => registerReferralJoin(payload);
export const getReferralJoins = async (payload) => getReferralCount(payload);
export const getWalletNotifications = async (walletAddress) => getNotifications(walletAddress);
