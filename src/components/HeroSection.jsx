import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const HeroSection = () => (
  <section className="section-shell pt-20">
    <div className="glass neon-border relative overflow-hidden px-6 py-14 sm:px-12">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-8 left-6 h-32 w-32 rounded-full bg-green-400/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-green-400/40 bg-green-500/10 px-4 py-1.5 text-sm text-green-300 shadow-pulse animate-pulseSlow">
          <span className="h-2 w-2 rounded-full bg-green-400" /> System Active
        </span>
        <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-6xl">
          SN1 Sentinel: The AI Shield of Solana
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
          Autonomous intelligence securing token launches with real-time anomaly detection, wallet behavior analysis, and on-chain threat prevention.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#"
            className="rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-6 py-3 font-semibold text-cyan-100 transition hover:shadow-glow hover:bg-cyan-300/20"
          >
            View Documentation
          </a>
          <WalletMultiButton />
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
