import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000';

const DEFAULT_ROOMS = [
  { id: 'global', name: 'Global Chat', type: 'public' },
  {
    id: 'snl1-holders',
    name: 'SNL1 Holders',
    type: 'token-gated',
    requirements: { tokenSymbol: 'SNL1', minBalance: 1000 },
  },
  {
    id: 'whales',
    name: 'Whale Lounge',
    type: 'token-gated',
    requirements: { tokenSymbol: 'SNL1', minBalance: 50000 },
  },
];

export const useChatSocket = (profile, tokenRooms = []) => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState('global');
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [error, setError] = useState('');

  const socket = useMemo(() => io(CHAT_ENDPOINT, { autoConnect: false, transports: ['websocket'] }), []);

  useEffect(() => {
    const uniqueTokenRooms = tokenRooms.map((token) => ({
      id: `token:${token.symbol.toUpperCase()}`,
      name: `${token.symbol.toUpperCase()} Token Room`,
      type: 'token-gated',
      requirements: { tokenSymbol: token.symbol.toUpperCase(), minBalance: 1 },
    }));

    const uniqueById = new Map([...DEFAULT_ROOMS, ...uniqueTokenRooms].map((room) => [room.id, room]));
    setRooms(Array.from(uniqueById.values()));
  }, [tokenRooms]);

  useEffect(() => {
    if (!profile?.address) return undefined;

    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      setError('');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:joined', ({ history }) => {
      setError('');
      setMessages(history || []);
    });

    socket.on('chat:roomDenied', (payload) => {
      setError(payload.reason || 'Room access denied.');
    });

    socket.on('chat:error', (payload) => {
      setError(payload.message || 'Chat error');
    });

    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat:joined');
      socket.off('chat:roomDenied');
      socket.off('chat:error');
      socket.off('chat:message');
      socket.disconnect();
    };
  }, [socket, profile?.address]);

  const joinRoom = (roomId, nickname = '') => {
    if (!profile?.address) return;

    setActiveRoom(roomId);
    socket.emit('chat:join', {
      roomId,
      walletAddress: profile.address,
      walletType: profile.walletType,
      avatar: profile.avatar,
      nickname,
    });
  };

  const sendMessage = (content) => {
    if (!profile?.address) return;
    socket.emit('chat:message', { walletAddress: profile.address, content });
  };

  return { messages, sendMessage, connected, joinRoom, activeRoom, rooms, error };
};
