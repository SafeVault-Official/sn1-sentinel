import { useState } from 'react';
import { shortWallet } from '../auth/profileService';

export const ChatPanel = ({ profile, messages, sendMessage, connected }) => {
  const [draft, setDraft] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft('');
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Global Social Chat</h3>
        <span className="text-xs text-slate-400">{connected ? 'Live' : 'Offline'}</span>
      </div>

      <div className="h-64 space-y-2 overflow-y-auto rounded bg-slate-950 p-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded border border-slate-800 p-2 text-sm">
            <div className="text-xs text-slate-400">{message.avatar?.emoji} {shortWallet(message.walletAddress)} • {new Date(message.timestamp).toLocaleTimeString()}</div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <form className="mt-2 flex gap-2" onSubmit={submit}>
        <input className="flex-1 rounded bg-slate-800 p-2" placeholder={`Say gm, ${shortWallet(profile?.address)}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="rounded bg-emerald-400 px-3 py-2 text-slate-950">Send</button>
      </form>
    </div>
  );
};
