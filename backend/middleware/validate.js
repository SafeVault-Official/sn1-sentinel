import { walletAddressRegex } from '../config/constants.js';

export const validateJoinPayload = (payload = {}) => {
  const isValidWallet = Boolean(payload.walletAddress && walletAddressRegex.test(payload.walletAddress));
  const isValidWalletType = typeof payload.walletType === 'string' && payload.walletType.trim().length > 0;

  if (!isValidWallet || !isValidWalletType) {
    return {
      ok: false,
      error: {
        code: 'INVALID_IDENTITY',
        message: 'Wallet identity is required.',
      },
    };
  }

  return { ok: true };
};

export const validateMessagePayload = (payload = {}, session) => {
  if (!session) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Join a room before messaging.',
      },
    };
  }

  if (payload.walletAddress !== session.walletAddress) {
    return {
      ok: false,
      error: {
        code: 'IDENTITY_MISMATCH',
        message: 'Wallet mismatch.',
      },
    };
  }

  return { ok: true };
};
