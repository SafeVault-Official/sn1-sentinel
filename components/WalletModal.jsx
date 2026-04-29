export const WalletModal = ({ wallets, availability, onConnect, connectingType, error, pilotName }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
    <h3 className="text-lg font-semibold">Connect Wallet</h3>
    <p className="mt-1 text-xs text-slate-400">{pilotName ? `${pilotName}, ` : ''}connect your wallet to unlock launch and trading actions.</p>
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-900/30 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onConnect(wallet.id)}
          disabled={!availability[wallet.id] || Boolean(connectingType)}
        >
          <div className="font-medium">{wallet.label}</div>
          <div className="text-xs text-slate-400">{availability[wallet.id] ? 'Available' : 'Not detected in this browser'}</div>
        </button>
      ))}
    </div>
    {connectingType ? <p className="mt-3 text-xs text-cyan-200">Connecting wallet... approve the popup in your wallet extension.</p> : null}
    {!wallets.some((wallet) => availability[wallet.id]) ? (
      <p className="mt-3 rounded border border-amber-500/40 bg-amber-950/40 p-2 text-xs text-amber-200">
        No supported wallet extension detected in this browser. Install MetaMask, Rabby, or another supported EVM wallet, then refresh.
      </p>
    ) : null}
    {error ? <p className="mt-3 rounded border border-rose-500/40 bg-rose-950/40 p-2 text-xs text-rose-200">{error}</p> : null}
  </div>
);
