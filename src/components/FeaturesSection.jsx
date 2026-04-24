import SectionTitle from './SectionTitle';

const features = [
  {
    title: 'Autonomous Monitoring',
    description: 'Persistent AI agents inspect mempool and chain events for exploit signatures 24/7.',
    icon: '🛰️',
  },
  {
    title: 'AI-Driven Analysis',
    description: 'Gemini 2.5 Flash-backed threat reasoning adapts to malicious behavior in real time.',
    icon: '🧠',
  },
  {
    title: 'Solana Ecosystem Security',
    description: 'From wallet trust scoring to launch protection, SN1 hardens protocol integrity.',
    icon: '🛡️',
  },
];

const FeaturesSection = () => (
  <section className="section-shell">
    <SectionTitle eyebrow="Features" title="Security Intelligence That Scales" />
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {features.map((feature) => (
        <article key={feature.title} className="glass p-6 transition duration-300 hover:border-cyan-300/60 hover:shadow-glow">
          <span className="text-3xl" role="img" aria-label="icon">{feature.icon}</span>
          <h4 className="mt-4 text-xl font-semibold text-white">{feature.title}</h4>
          <p className="mt-3 text-slate-300">{feature.description}</p>
        </article>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
