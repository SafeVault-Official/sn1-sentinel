import { useState } from 'react';
import SectionTitle from './SectionTitle';

const tiers = [
  { name: 'Bronze', required: 100, benefits: 'Reduced launch fees' },
  { name: 'Silver', required: 500, benefits: 'Priority launch queue' },
  { name: 'Gold', required: 1000, benefits: 'Enhanced AI scan depth' },
  { name: 'Sentinel', required: 5000, benefits: 'Maximum AI protection boost' },
];

const NftBadgeSection = ({ walletConnected, sn1Balance }) => {
  const [message, setMessage] = useState('');

  const mintBadge = (tier) => {
    if (!walletConnected) {
      setMessage('Connect your wallet to mint a badge.');
      return;
    }

    if (sn1Balance < tier.required) {
      setMessage(`Insufficient SN1 for ${tier.name} badge.`);
      return;
    }

    setMessage(`${tier.name} badge minted successfully (mock transaction).`);
  };

  return (
    <section className="section-shell">
      <SectionTitle eyebrow="NFT Badge System" title="Earn Security Status Tiers" subtitle="Stake SN1 reputation and unlock strategic advantages for every launch." />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <article key={tier.name} className="glass neon-border flex flex-col p-5 transition hover:-translate-y-1">
            <h4 className="text-xl font-semibold text-cyan-100">{tier.name}</h4>
            <p className="mt-2 text-sm text-slate-300">{tier.required} SN1</p>
            <p className="mt-4 flex-1 text-sm text-slate-200">{tier.benefits}</p>
            <button
              type="button"
              onClick={() => mintBadge(tier)}
              className="mt-5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Mint Badge
            </button>
          </article>
        ))}
      </div>
      {message ? <p className="mt-5 text-center text-sm text-green-300">{message}</p> : null}
    </section>
  );
};

export default NftBadgeSection;
