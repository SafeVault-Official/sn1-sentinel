import { useEffect, useMemo, useRef, useState } from 'react';
import { shortWallet } from '../auth/profileService';

const nicknameStorageKey = (address) => `sn1.nickname.${address || 'guest'}`;

export const ChatPanel = ({
  profile,
  messages,
  sendMessage,
  connected,
  activeRoom,
  rooms,
  joinRoom,
  error,
}) => {
  const [draft, setDraft] = useState('');
  const [nickname, setNickname] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const local = window.localStorage.getItem(nicknameStorageKey(profile?.address));
    setNickname(local || '');
  }, [profile?.address]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, activeRoom]);

  useEffect(() => {
    if (!profile?.address) return;
    joinRoom(activeRoom || 'global', nickname);
  }, [profile?.address]);

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft('');
  };

  const saveNickname = (value) => {
    setNickname(value);
    if (!profile?.address) return;
    window.localStorage.setItem(nicknameStorageKey(profile.address), value);
    joinRoom(activeRoom, value);
  };

  const activeRoomData = useMemo(() => rooms.find((room) => room.id === activeRoom), [rooms, activeRoom]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Real-Time Social Chat</h3>
        <span className="text-xs text-slate-400">{connected ? 'Live' : 'Offline'}</span>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <select
          className="rounded bg-slate-800 p-2 text-sm"
          value={activeRoom}
          onChange={(e) => joinRoom(e.target.value, nickname)}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>

        <input
          className="rounded bg-slate-800 p-2 text-sm"
          placeholder="Nickname (optional)"
          value={nickname}
          onChange={(e) => saveNickname(e.target.value.slice(0, 20))}
        />

        <div className="rounded bg-slate-950 p-2 text-xs text-slate-300">
          {activeRoomData?.requirements
            ? `Gated: ${activeRoomData.requirements.minBalance} ${activeRoomData.requirements.tokenSymbol}`
            : 'Public room'}
        </div>
      </div>

      {error ? <p className="mb-2 rounded bg-rose-900/50 p-2 text-xs text-rose-200">{error}</p> : null}

      <div ref={listRef} className="h-64 space-y-2 overflow-y-auto rounded bg-slate-950 p-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded border border-slate-800 p-2 text-sm">
            <div className="text-xs text-slate-400">
              {message.avatar?.emoji || '🙂'} {message.nickname || shortWallet(message.walletAddress)} •{' '}
              {shortWallet(message.walletAddress)} • {new Date(message.timestamp).toLocaleTimeString()}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <form className="mt-2 flex gap-2" onSubmit={submit}>
        <input
          className="flex-1 rounded bg-slate-800 p-2"
          placeholder={`Message ${activeRoomData?.name || 'chat'} as ${nickname || shortWallet(profile?.address)}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="rounded bg-emerald-400 px-3 py-2 text-slate-950">Send</button>
      </form>
    </div>
  );
};
