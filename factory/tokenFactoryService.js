import {
  buyToken,
  createToken,
  getTokens,
  getTradableTokens,
  getTreasurySnapshot,
  sellToken,
  createShareLink,
  getAllTokens,
  getMarketSnapshot,
  getNotifications,
  getReferralCount,
  getTokenDetail,
  registerReferralJoin,
  tradeToken,
} from '../mock-blockchain/mockBlockchainService';

export const tokenFactoryPlaceholder = {
  contractName: 'SNL1TokenFactory',
  contractAddress: '0x0000000000000000000000000000000000000000',
  createTokenMethod: 'createToken(string name, string symbol, uint256 totalSupply, string metadataURI)',
  buyMethod: 'buyToken(address tokenAddress, uint256 amount)',
  sellMethod: 'sellToken(address tokenAddress, uint256 amount)',
};

// Temel Token İşlemleri
export const createLaunchpadToken = async (payload) => createToken(payload);
export const getWalletCreatedTokens = async (walletAddress) => getTokens(walletAddress);
export const getAllLaunchpadTokens = async () => getAllTokens();
export const getLaunchpadTokenDetail = async (tokenId) => getTokenDetail(tokenId);

// Alım-Satım ve Ekonomi (Bonding Curve & Trade)
export const getAllTradableTokens = async () => getTradableTokens();
export const buyLaunchpadToken = async (payload) => buyToken(payload);
export const sellLaunchpadToken = async (payload) => sellToken(payload);
export const tradeLaunchpadToken = async (payload) => tradeToken(payload);

// Analiz ve Hazine
export const getPlatformTreasury = async () => getTreasurySnapshot();
export const getGrowthSnapshot = async (payload) => getMarketSnapshot(payload);

// Sosyal, Referans ve Bildirimler
export const getTokenShareLink = async (payload) => createShareLink(payload);
export const registerReferral = async (payload) => registerReferralJoin(payload);
export const getReferralJoins = async (payload) => getReferralCount(payload);
export const getWalletNotifications = async (walletAddress) => getNotifications(walletAddress);