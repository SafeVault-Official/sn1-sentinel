import { resolveAvatarTier } from '../../features/avatar/avatarLogic';

const AvatarCard = ({ usdBalance }) => {
  const tier = resolveAvatarTier(usdBalance);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Dynamic NFT Avatar</p>
      <div className={`mt-3 rounded-xl bg-gradient-to-br ${tier.accent} p-5 text-center`}>
        <p className="text-5xl">{tier.emoji}</p>
        <p className="mt-2 text-sm font-semibold text-white">{tier.title}</p>
      </div>
      <p className="mt-3 text-xs text-slate-400">Auto-switches by wallet USD value tier.</p>
    </div>
  );
};

export default AvatarCard;
