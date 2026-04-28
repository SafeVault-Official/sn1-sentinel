import { EvmBlockchainProvider } from './providers/evmProvider';
import { MockBlockchainProvider } from './providers/mockProvider';

const SUPPORTED_NETWORKS = {
  mock: {
    id: 'mock',
    label: 'Mock',
    createProvider: () => new MockBlockchainProvider(),
  },
  testnet: {
    id: 'testnet',
    label: 'Sepolia Testnet',
    createProvider: () =>
      new EvmBlockchainProvider({
        network: 'testnet',
        chainIdHex: '0xaa36a7',
        rpcUrl: import.meta.env.VITE_TESTNET_RPC_URL || 'https://rpc.sepolia.org',
      }),
  },
  mainnet: {
    id: 'mainnet',
    label: 'Ethereum Mainnet',
    createProvider: () =>
      new EvmBlockchainProvider({
        network: 'mainnet',
        chainIdHex: '0x1',
        rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL || 'https://cloudflare-eth.com',
      }),
  },
};

const DEFAULT_NETWORK = 'mock';

class BlockchainService {
  constructor() {
    const requestedNetwork = import.meta.env.VITE_BLOCKCHAIN_NETWORK || DEFAULT_NETWORK;
    this.setNetwork(requestedNetwork);
  }

  setNetwork(networkId) {
    const networkConfig = SUPPORTED_NETWORKS[networkId] || SUPPORTED_NETWORKS[DEFAULT_NETWORK];
    this.network = networkConfig.id;
    this.provider = networkConfig.createProvider();
    return this.network;
  }

  getNetwork() {
    return this.network;
  }

  getAvailableNetworks() {
    return Object.values(SUPPORTED_NETWORKS).map(({ id, label }) => ({ id, label }));
  }

  async getBalance(walletAddress) {
    return this.provider.getBalance(walletAddress);
  }

  async createTransaction(data) {
    return this.provider.createTransaction(data);
  }

  async transferToken(from, to, amount) {
    return this.provider.transferToken(from, to, amount);
  }

  async getTransactionHistory(walletAddress) {
    return this.provider.getTransactionHistory(walletAddress);
  }
}

export const blockchainService = new BlockchainService();
