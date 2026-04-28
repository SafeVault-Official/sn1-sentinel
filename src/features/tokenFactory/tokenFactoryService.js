import { createMockToken, getMockCreatedTokens } from '../../services/mockBlockchain';

/**
 * This adapter separates factory business logic from UI.
 * Later: replace createMockToken/getMockCreatedTokens with contract calls.
 */
export const tokenFactoryService = {
  createToken: async (payload) => {
    return createMockToken(payload);
  },
  listCreatedTokens: async (walletAddress) => {
    return getMockCreatedTokens(walletAddress);
  },
};
