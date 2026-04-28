export const AVATAR_TIERS = {
  basic: {
    key: 'basic',
    title: 'Basic T-shirt Avatar',
    min: 0,
    max: 10,
    emoji: '👕',
    accent: 'from-slate-500 to-slate-700',
  },
  normal: {
    key: 'normal',
    title: 'Normal Outfit Avatar',
    min: 10,
    max: 50,
    emoji: '🧥',
    accent: 'from-cyan-500 to-blue-700',
  },
  glasses: {
    key: 'glasses',
    title: 'Sunglasses Avatar',
    min: 50,
    max: 1000,
    emoji: '😎',
    accent: 'from-purple-500 to-indigo-700',
  },
  whale: {
    key: 'whale',
    title: 'Whale VIP Avatar',
    min: 1000,
    max: Infinity,
    emoji: '🐋',
    accent: 'from-amber-400 to-fuchsia-700',
  },
};

export const resolveAvatarTier = (usdBalance) => {
  if (usdBalance >= AVATAR_TIERS.whale.min) {
    return AVATAR_TIERS.whale;
  }

  if (usdBalance >= AVATAR_TIERS.glasses.min) {
    return AVATAR_TIERS.glasses;
  }

  if (usdBalance >= AVATAR_TIERS.normal.min) {
    return AVATAR_TIERS.normal;
  }

  return AVATAR_TIERS.basic;
};
