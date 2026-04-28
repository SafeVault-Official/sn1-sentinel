const avatarTierRules = [
  { min: 1000, tier: 'WHALE VIP', accent: '#f59e0b', emoji: '🐋', outfit: 'whale crown' },
  { min: 50, tier: 'SUNGASSES', accent: '#22d3ee', emoji: '😎', outfit: 'sunglasses' },
  { min: 10, tier: 'STANDARD', accent: '#3b82f6', emoji: '🙂', outfit: 'hoodie' },
  { min: 0, tier: 'BASIC', accent: '#64748b', emoji: '🧢', outfit: 't-shirt' },
];

export const resolveAvatarFromUsd = (usdBalance = 0) => {
  const activeRule = avatarTierRules.find((rule) => usdBalance >= rule.min) || avatarTierRules.at(-1);

  return {
    ...activeRule,
    usdBalance,
    badgeText: `${activeRule.tier} • $${usdBalance.toFixed(2)}`,
  };
};
