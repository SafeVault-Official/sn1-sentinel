import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4000';

export const useChatSocket = (profile) => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  const socket = useMemo(() => io(CHAT_ENDPOINT, { autoConnect: Boolean(profile?.address) }), [profile?.address]);

  useEffect(() => {
    if (!profile?.address) return undefined;

    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', profile);
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:history', (history) => setMessages(history));
    socket.on('chat:message', (message) => setMessages((prev) => [...prev, message]));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat:history');
      socket.off('chat:message');
      socket.disconnect();
    };
  }, [socket, profile]);

  const sendMessage = (content) => {
    socket.emit('chat:message', { content });
  };

  return { messages, sendMessage, connected };
};
