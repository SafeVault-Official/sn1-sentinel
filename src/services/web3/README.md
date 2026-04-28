# Web3 Foundation Layer

This folder contains the production-oriented abstraction layer requested for Step 1.

## 1) Unified Wallet Layer (`walletService.js`)

Stable wallet API:

- `connectWallet(preferredType?)`
- `disconnectWallet()`
- `getWalletAddress()`
- `getWalletType()`
- `getNetwork()`
- `getWalletSnapshot()`
- `getNetworkStatus()`

Normalized wallet shape:

```js
{
  address: string,
  type: 'phantom' | 'metamask' | 'walletconnect',
  network: string,
  connected: boolean,
}
```

Error codes for product-level handling:

- `WALLET_NOT_INSTALLED`
- `USER_REJECTED`
- `NETWORK_MISMATCH`
- `WALLET_DISCONNECTED`
- `UNKNOWN`

## 2) Blockchain Abstraction Layer (`blockchainService.js`)

Stable chain API:

- `getBalance(walletAddress)`
- `transferToken(from, to, amount)`
- `createTransaction(data)`
- `getTransactionHistory(walletAddress)`
- `setNetwork(networkId)`
- `getNetwork()`
- `getAvailableNetworks()`

### Provider switching

`blockchainService` now routes through provider adapters in `providers/` and can be switched across:

- `mock`
- `testnet` (Sepolia RPC)
- `mainnet` (Ethereum Mainnet RPC)

Default selection comes from `VITE_BLOCKCHAIN_NETWORK` (fallback: `mock`).

Optional RPC overrides:

- `VITE_TESTNET_RPC_URL`
- `VITE_MAINNET_RPC_URL`

## 3) State Management Layer

`WalletContext` hydrates balance state from `blockchainService`, so UI modules stay transport-agnostic.

## 4) Mock -> Real Migration Strategy

Future real contract write support only needs provider adapter updates in:

- `providers/evmProvider.js` for RPC + contract writes
- `providers/mockProvider.js` for local simulation behavior

UI and feature modules should keep using the same exported methods.
