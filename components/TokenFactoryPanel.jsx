import { useState } from 'react';
import { createLaunchpadToken } from '../factory/tokenFactoryService';

const initialState = {
  name: '',
  symbol: '',
  supply: '',
  logo: '',
  logoFile: '',
  basePrice: '0.01',
  curveK: '0.0001',
};

export const TokenFactoryPanel = ({ walletAddress, onCreated }) => {
  const [form, setForm] = useState(initialState);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState({ tone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setForm((prev) => ({ ...prev, logoFile: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    const parsedSupply = Number(form.supply);
    const parsedBasePrice = Number(form.basePrice);
    const parsedCurveK = Number(form.curveK);

    if (!walletAddress) {
      setStatus({ tone: 'error', message: 'Connect a wallet before creating a token.' });
      return;
    }

    if (!parsedSupply || parsedSupply < 1) {
      setStatus({ tone: 'error', message: 'Initial supply must be at least 1.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: 'info', message: 'Creating token and initializing bonding curve...' });

    try {
      await createLaunchpadToken({
        name: form.name,
        symbol: form.symbol,
        supply: parsedSupply,
        logo: form.logo || form.logoFile,
        basePrice: parsedBasePrice,
        curveK: parsedCurveK,
        creatorWallet: walletAddress,
      });

      setForm(initialState);
      setPreview('');
      setStatus({ tone: 'success', message: 'Token created with bonding curve enabled.' });
      onCreated?.();
    } catch (error) {
      setStatus({ tone: 'error', message: `Create failed: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900 p-4" onSubmit={submit}>
      <h3 className="text-lg font-semibold">Token Factory + Bonding Curve</h3>
      <p className="text-xs text-slate-400">
        You&apos;ll deploy a launchpad token and configure its initial pricing curve. Required fields are marked by browser validation.
      </p>
      <input className="w-full rounded bg-slate-800 p-2" placeholder="Token Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
      <input className="w-full rounded bg-slate-800 p-2" placeholder="Symbol" value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} required />
      <input className="w-full rounded bg-slate-800 p-2" type="number" min="1" step="1" placeholder="Initial Supply" value={form.supply} onChange={(e) => setForm((p) => ({ ...p, supply: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-2">
        <input className="w-full rounded bg-slate-800 p-2" type="number" min="0.000001" step="0.000001" placeholder="Base Price" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} required />
        <input className="w-full rounded bg-slate-800 p-2" type="number" min="0.000001" step="0.000001" placeholder="k Growth" value={form.curveK} onChange={(e) => setForm((p) => ({ ...p, curveK: e.target.value }))} required />
      </div>
      <input className="w-full rounded bg-slate-800 p-2" placeholder="Logo URL" value={form.logo} onChange={(e) => { setPreview(e.target.value); setForm((p) => ({ ...p, logo: e.target.value })); }} />
      <input className="w-full text-xs" type="file" accept="image/*" onChange={handleFile} />
      {preview ? <img src={preview} alt="preview" className="h-16 w-16 rounded" /> : null}
      <button disabled={isSubmitting || !walletAddress} className="rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Creating Token...' : 'Create Token'}
      </button>
      {!walletAddress ? <p className="text-xs text-amber-300">Wallet required: connect first to set creator ownership.</p> : null}
      {status.message ? (
        <p className={`text-xs ${status.tone === 'error' ? 'text-rose-300' : status.tone === 'success' ? 'text-emerald-300' : 'text-cyan-200'}`}>
          {status.message}
        </p>
      ) : null}
    </form>
  );
};
