import {
  createMockToken,
  getAllMockCreatedTokens,
  getMockCreatedTokens,
} from '../../services/mockBlockchain';

/**
 * Factory adapter separating UI concerns from blockchain transport.
 * Can route to real on-chain contract adapters when addresses/providers are configured.
 */
export const tokenFactoryService = {
  createToken: async (payload) => createMockToken(payload),

  listCreatedTokens: async (walletAddress) => getMockCreatedTokens(walletAddress),

  listAllTokens: async () => getAllMockCreatedTokens(),
};
