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

Stable chain API (mock-first):

- `getBalance(walletAddress)`
- `transferToken(from, to, amount)`
- `createTransaction(data)`
- `getTransactionHistory(walletAddress)`

The current implementation stores state in localStorage and simulates
transaction lifecycle (`pending -> confirmed/failed`).

## 3) State Management Layer

`wallet/useWalletSession.jsx` now hydrates global state from these services and
exposes both:

- UI-friendly `session` data
- a `web3` object with the raw service interfaces for future feature modules

## 4) Mock -> Real Migration Strategy

Future real contract integration requires implementation replacement in only:

- `walletService.js` for provider/session logic
- `blockchainService.js` for contract reads/writes

UI and feature modules should keep using the same exported methods.
