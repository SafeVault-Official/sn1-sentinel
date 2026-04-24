import SectionTitle from './SectionTitle';

const CoreMissionSection = () => (
  <section className="section-shell">
    <div className="glass px-6 py-12 sm:px-12">
      <SectionTitle
        eyebrow="Core Mission"
        title="An Autonomous AI Sentinel for Solana"
        subtitle="SN1 Sentinel continuously monitors on-chain behavior, contract events, and launch activities to prevent exploit vectors before they escalate. Powered by Gemini 2.5 Flash intelligence loops, it detects suspicious patterns in real time and enforces trust-first launches."
      />
    </div>
  </section>
);

export default CoreMissionSection;
