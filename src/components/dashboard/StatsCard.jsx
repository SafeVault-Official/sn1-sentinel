const StatsCard = ({ walletAddress, snl1Balance, usdBalance, isLoadingBalance }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">Wallet Dashboard</p>
    <div className="mt-3 space-y-2 text-sm">
      <p>
        <span className="text-slate-400">Address:</span> <span className="text-cyan-200">{walletAddress || 'Not connected'}</span>
      </p>
      <p>
        <span className="text-slate-400">Mock SNL1:</span>{' '}
        <span className="font-semibold text-emerald-300">{isLoadingBalance ? 'Loading...' : `${snl1Balance.toLocaleString()} SNL1`}</span>
      </p>
      <p>
        <span className="text-slate-400">Mock USD:</span>{' '}
        <span className="font-semibold text-amber-300">{isLoadingBalance ? 'Loading...' : `$${usdBalance.toLocaleString()}`}</span>
      </p>
    </div>
  </div>
);

export default StatsCard;
