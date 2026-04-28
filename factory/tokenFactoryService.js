import {
  buyToken,
  createToken,
  getTokens,
  getTradableTokens,
  getTreasurySnapshot,
  sellToken,
} from '../mock-blockchain/mockBlockchainService';

export const tokenFactoryPlaceholder = {
  contractName: 'SNL1TokenFactory',
  contractAddress: '0x0000000000000000000000000000000000000000',
  createTokenMethod: 'createToken(string name, string symbol, uint256 totalSupply, string metadataURI)',
  buyMethod: 'buyToken(address tokenAddress, uint256 amount)',
  sellMethod: 'sellToken(address tokenAddress, uint256 amount)',
};

export const createLaunchpadToken = async (payload) => createToken(payload);
export const getWalletCreatedTokens = async (walletAddress) => getTokens(walletAddress);
export const getAllTradableTokens = async () => getTradableTokens();
export const buyLaunchpadToken = async (payload) => buyToken(payload);
export const sellLaunchpadToken = async (payload) => sellToken(payload);
export const getPlatformTreasury = async () => getTreasurySnapshot();
