export const WalletModal = ({ wallets, availability, onConnect, connectingType }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
    <h3 className="text-lg font-semibold">Connect Wallet</h3>
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-left hover:border-cyan-400"
          onClick={() => onConnect(wallet.id)}
          disabled={connectingType === wallet.id}
        >
          <div className="font-medium">{wallet.label}</div>
          <div className="text-xs text-slate-400">{availability[wallet.id] ? 'Available' : 'Not detected (mock enabled)'}</div>
        </button>
      ))}
    </div>
  </div>
);
