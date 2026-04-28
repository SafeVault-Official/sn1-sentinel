/**
 * Web3 integration placeholders.
 * Swap this file to real contract adapters once contracts are deployed.
 */

export const CONTRACTS = {
  snl1Erc20: {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000000',
  },
  tokenFactory: {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000000',
  },
};

export const readSnl1BalanceOnChain = async (_walletAddress) => {
  throw new Error('TODO: Replace mock read with ERC-20 balanceOf call.');
};

export const writeCreateTokenOnChain = async (_payload) => {
  throw new Error('TODO: Replace mock write with TokenFactory.createToken call.');
};
