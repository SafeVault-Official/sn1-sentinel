import { createToken, getTokens } from '../mock-blockchain/mockBlockchainService';

export const tokenFactoryPlaceholder = {
  contractName: 'SNL1TokenFactory',
  contractAddress: '0x0000000000000000000000000000000000000000',
  createTokenMethod: 'createToken(string name, string symbol, uint256 totalSupply, string metadataURI)',
};

export const createLaunchpadToken = async (payload) => createToken(payload);
export const getWalletCreatedTokens = async (walletAddress) => getTokens(walletAddress);
