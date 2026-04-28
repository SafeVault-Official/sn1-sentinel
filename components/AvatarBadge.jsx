export const AvatarBadge = ({ avatar }) => {
  if (!avatar) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="text-3xl">{avatar.emoji}</div>
      <div className="mt-2 text-sm font-semibold" style={{ color: avatar.accent }}>
        {avatar.badgeText}
      </div>
      <div className="text-xs text-slate-400">Outfit: {avatar.outfit}</div>
    </div>
  );
};
