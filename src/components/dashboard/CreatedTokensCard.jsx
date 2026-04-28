import { useEffect, useState } from 'react';
import { tokenFactoryService } from '../../features/tokenFactory/tokenFactoryService';

const CreatedTokensCard = ({ walletAddress, refreshKey }) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    if (!walletAddress) {
      setTokens([]);
      return;
    }

    tokenFactoryService.listCreatedTokens(walletAddress).then(setTokens);
  }, [walletAddress, refreshKey]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Created Tokens (Mock)</p>
      {!tokens.length ? (
        <p className="mt-3 text-sm text-slate-400">No tokens created yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {tokens.map((token) => (
            <li key={token.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
              <p className="font-semibold text-cyan-200">{token.tokenName} ({token.symbol})</p>
              <p className="text-xs text-slate-400">Supply: {token.supply.toLocaleString()} · {new Date(token.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CreatedTokensCard;
