/**
 * EVM contract integration placeholders and ABIs.
 * This app currently uses the simulated adapter until provider wiring is enabled.
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

export const SNL1_ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
  'function mint(address,uint256) returns (bool)',
];

export const TOKEN_FACTORY_ABI = [
  'function createToken(string,string,uint256,string) returns (address)',
  'function createTokenWithImage(string,string,uint256,string,string) returns (address)',
  'function getAllTokens() view returns ((address tokenAddress,address creator,string name,string symbol,uint256 supply,string metadataURI,string imageURI,uint256 createdAt)[])',
  'function getTokensByCreator(address) view returns ((address tokenAddress,address creator,string name,string symbol,uint256 supply,string metadataURI,string imageURI,uint256 createdAt)[])',
  'event TokenCreated(address indexed tokenAddress,address indexed creator)',
];

export const readSnl1BalanceOnChain = async (_walletAddress) => {
  throw new Error('TODO: Replace mock read with ERC-20 balanceOf call.');
};

export const writeCreateTokenOnChain = async (_payload) => {
  throw new Error('TODO: Replace mock write with TokenFactory.createToken call.');
};
