import SectionTitle from './SectionTitle';

const lines = [
  'Connecting to Solana network...',
  'Wallet verified',
  'Running Sentinel AI Scan...',
  'System Status: Optimal',
  'Threat Level: Low',
];

const LiveDashboardSection = () => (
  <section className="section-shell">
    <SectionTitle
      eyebrow="Live Dashboard Preview"
      title="Sentinel Terminal Feed"
      subtitle="Observe continuous security telemetry as SN1 verifies wallet integrity and monitors threat conditions."
    />
    <div className="glass neon-border mt-10 overflow-hidden px-6 py-6 sm:px-8">
      <div className="mb-6 flex gap-2">
        <span className="h-3 w-3 rounded-full bg-red-400/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
        <span className="h-3 w-3 rounded-full bg-green-400/70" />
      </div>
      <div className="space-y-3 font-mono text-sm sm:text-base">
        {lines.map((line) => (
          <p key={line} className="text-cyan-200/95">
            <span className="mr-2 text-cyan-400">&gt;</span>
            <span className="inline-block overflow-hidden whitespace-nowrap border-r border-cyan-300/80 pr-1 align-bottom animate-terminal">
              {line}
            </span>
          </p>
        ))}
      </div>
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-green-300 animate-flicker">SENTINEL UPLINK STABLE</p>
    </div>
  </section>
);

export default LiveDashboardSection;
