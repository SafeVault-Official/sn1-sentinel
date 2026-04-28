const DEFAULT_USD_FALLBACK = 0;

const toEth = (hexWei) => {
  if (!hexWei) return 0;
  const wei = BigInt(hexWei);
  const whole = Number(wei / 10n ** 18n);
  const fraction = Number((wei % 10n ** 18n) / 10n ** 14n) / 10000;
  return Number((whole + fraction).toFixed(4));
};

const buildRpcPayload = (method, params = []) => ({
  jsonrpc: '2.0',
  id: Date.now(),
  method,
  params,
});

export class EvmBlockchainProvider {
  constructor({ network, rpcUrl, chainIdHex }) {
    this.network = network;
    this.rpcUrl = rpcUrl;
    this.chainIdHex = chainIdHex;
  }

  async rpc(method, params = []) {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRpcPayload(method, params)),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed (${response.status}) for ${this.network}.`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || `RPC ${method} failed for ${this.network}.`);
    }

    return data.result;
  }

  async getBalance(walletAddress) {
    if (!walletAddress) {
      return { usdBalance: 0, snl1Balance: 0 };
    }

    const [chainId, nativeBalanceHex] = await Promise.all([
      this.rpc('eth_chainId'),
      this.rpc('eth_getBalance', [walletAddress, 'latest']),
    ]);

    if (chainId !== this.chainIdHex) {
      throw new Error(`RPC chain mismatch: expected ${this.chainIdHex}, got ${chainId}.`);
    }

    return {
      usdBalance: DEFAULT_USD_FALLBACK,
      snl1Balance: toEth(nativeBalanceHex),
      unit: 'ETH',
    };
  }

  async createTransaction() {
    throw new Error(`Transaction creation is not wired for ${this.network} yet.`);
  }

  async transferToken() {
    throw new Error(`Token transfer is not wired for ${this.network} yet.`);
  }

  async getTransactionHistory() {
    throw new Error(`Transaction history is not wired for ${this.network} yet.`);
  }
}
