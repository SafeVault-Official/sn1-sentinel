import { useState } from 'react';
import { createLaunchpadToken } from '../factory/tokenFactoryService';

const initialState = { name: '', symbol: '', supply: '', logo: '', logoFile: '' };

export const TokenFactoryPanel = ({ walletAddress, onCreated }) => {
  const [form, setForm] = useState(initialState);
  const [preview, setPreview] = useState('');

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

    await createLaunchpadToken({
      name: form.name,
      symbol: form.symbol,
      supply: Number(form.supply),
      logo: form.logo || form.logoFile,
      creatorWallet: walletAddress,
    });

    setForm(initialState);
    setPreview('');
    onCreated?.();
  };

  return (
    <form className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900 p-4" onSubmit={submit}>
      <h3 className="text-lg font-semibold">Token Factory (Mock, Contract-ready)</h3>
      <input className="w-full rounded bg-slate-800 p-2" placeholder="Token Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
      <input className="w-full rounded bg-slate-800 p-2" placeholder="Symbol" value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} required />
      <input className="w-full rounded bg-slate-800 p-2" type="number" placeholder="Supply" value={form.supply} onChange={(e) => setForm((p) => ({ ...p, supply: e.target.value }))} required />
      <input className="w-full rounded bg-slate-800 p-2" placeholder="Logo URL" value={form.logo} onChange={(e) => { setPreview(e.target.value); setForm((p) => ({ ...p, logo: e.target.value })); }} />
      <input className="w-full text-xs" type="file" accept="image/*" onChange={handleFile} />
      {preview ? <img src={preview} alt="preview" className="h-16 w-16 rounded" /> : null}
      <button className="rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950">Create Token</button>
    </form>
  );
};
