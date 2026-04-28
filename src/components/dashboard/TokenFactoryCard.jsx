import { useEffect, useState } from 'react';
import { tokenFactoryService } from '../../features/tokenFactory/tokenFactoryService';

const emptyForm = {
  tokenName: '',
  symbol: '',
  supply: '',
  metadataURI: '',
  imageURI: '',
};

const TokenFactoryCard = ({ walletAddress, isConnected, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!isConnected) {
      setStatus('Connect wallet before creating a token.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Creating token via launchpad factory...');

    try {
      const created = await tokenFactoryService.createToken({ ...form, walletAddress });
      setStatus(`Success: ${created.tokenName} deployed at ${created.tokenAddress}`);
      setForm(emptyForm);
      onCreated?.();
    } catch (error) {
      setStatus(`Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setStatus('');
  }, [walletAddress]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Token Factory</p>
      <form className="mt-3 grid gap-3" onSubmit={handleCreate}>
        <input required placeholder="Token Name" value={form.tokenName} onChange={(e) => updateField('tokenName', e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        <input required maxLength={12} placeholder="Symbol" value={form.symbol} onChange={(e) => updateField('symbol', e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        <input required type="number" min="1" placeholder="Supply" value={form.supply} onChange={(e) => updateField('supply', e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        <input placeholder="Metadata URI (IPFS/HTTPS)" value={form.metadataURI} onChange={(e) => updateField('metadataURI', e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        <input placeholder="Image URL" value={form.imageURI} onChange={(e) => updateField('imageURI', e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        <button disabled={isSubmitting} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50">
          {isSubmitting ? 'Creating...' : 'Create Token'}
        </button>
      </form>
      {status ? <p className="mt-3 break-all text-xs text-cyan-200">{status}</p> : null}
    </div>
  );
};

export default TokenFactoryCard;
