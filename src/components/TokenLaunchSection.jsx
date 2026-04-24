import { useState } from 'react';

const TokenLaunchSection = ({ walletConnected, sn1Balance }) => {
  const [form, setForm] = useState({ tokenName: '', symbol: '', supply: '' });
  const [status, setStatus] = useState({ type: '', message: '' });

  const deployToken = (event) => {
    event.preventDefault();
    if (!walletConnected) {
      setStatus({ type: 'error', message: 'Connect a wallet before deployment.' });
      return;
    }
    if (sn1Balance < 250) {
      setStatus({ type: 'error', message: 'Insufficient SN1 balance. Deployment requires 250+ SN1.' });
      return;
    }
    setStatus({ type: 'success', message: `${form.tokenName || 'Token'} deployed successfully in sentinel simulation.` });
  };

  return (
    <section className="section-shell">
      <div className="glass p-6 sm:p-10">
        <h3 className="text-2xl font-bold text-white">Token Launch Console</h3>
        <p className="mt-2 text-slate-300">Deployment requires SN1 tokens.</p>
        <form onSubmit={deployToken} className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { label: 'Token Name', key: 'tokenName', type: 'text' },
            { label: 'Symbol', key: 'symbol', type: 'text' },
            { label: 'Supply', key: 'supply', type: 'number' },
          ].map((input) => (
            <label key={input.key} className="text-sm text-slate-300">
              {input.label}
              <input
                required
                type={input.type}
                value={form[input.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [input.key]: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-cyan-400/30 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:shadow-glow"
              />
            </label>
          ))}
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 font-semibold text-slate-900 transition hover:scale-[1.02] hover:shadow-glow"
            >
              Deploy Token with SN1
            </button>
          </div>
        </form>
        {status.message ? (
          <p className={`mt-4 text-sm ${status.type === 'error' ? 'text-rose-300' : 'text-green-300'}`}>{status.message}</p>
        ) : null}
      </div>
    </section>
  );
};

export default TokenLaunchSection;
