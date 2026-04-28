import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createInMemoryStore } from './store.js';
import { baseRooms, resolveRoom } from './rooms.js';
import { canAccessRoom } from './blockchainAdapter.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

const store = createInMemoryStore();
baseRooms.forEach((room) => store.ensureRoom(room));

const messageRateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 8;

const shortAddressRegex = /^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/;

const sanitizeMessage = (value = '') =>
  value
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);

const isValidIdentity = (payload) => Boolean(payload?.walletAddress && shortAddressRegex.test(payload.walletAddress) && payload.walletType);

const isRateLimited = (walletAddress) => {
  const now = Date.now();
  const recent = (messageRateMap.get(walletAddress) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  recent.push(now);
  messageRateMap.set(walletAddress, recent);
  return recent.length > RATE_LIMIT_MAX_MESSAGES;
};

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'sn1-chat-backend',
    usersOnline: Array.from(store.users.values()).length,
    rooms: Array.from(store.rooms.values()),
  });
});

app.get('/rooms', (_, res) => {
  res.json({ rooms: Array.from(store.rooms.values()) });
});

io.on('connection', (socket) => {
  socket.on('chat:join', async (payload = {}) => {
    if (!isValidIdentity(payload)) {
      socket.emit('chat:error', { code: 'INVALID_IDENTITY', message: 'Wallet identity is required.' });
      return;
    }

    const room = resolveRoom(payload.roomId || 'global');
    if (!room) {
      socket.emit('chat:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found.' });
      return;
    }

    const gate = await canAccessRoom({ walletAddress: payload.walletAddress, room });
    if (!gate.allowed) {
      socket.emit('chat:roomDenied', { roomId: room.id, reason: gate.reason, requirements: room.requirements });
      return;
    }

    const previousSession = store.getSession(socket.id);
    if (previousSession?.roomId && previousSession.roomId !== room.id) {
      socket.leave(previousSession.roomId);
    }

    socket.join(room.id);
    store.ensureRoom(room);
    const session = {
      walletAddress: payload.walletAddress,
      walletType: payload.walletType,
      avatar: payload.avatar || null,
      nickname: payload.nickname || '',
      roomId: room.id,
      connectedAt: new Date().toISOString(),
    };

    store.upsertSession(socket.id, session);

    socket.emit('chat:joined', {
      room,
      profile: {
        walletAddress: session.walletAddress,
        walletType: session.walletType,
        avatar: session.avatar,
        nickname: session.nickname,
      },
      history: store.getRoomHistory(room.id),
    });
  });

  socket.on('chat:message', (payload = {}) => {
    const session = store.getSession(socket.id);
    if (!session) {
      socket.emit('chat:error', { code: 'UNAUTHORIZED', message: 'Join a room before messaging.' });
      return;
    }

    if (payload.walletAddress !== session.walletAddress) {
      socket.emit('chat:error', { code: 'IDENTITY_MISMATCH', message: 'Wallet mismatch.' });
      return;
    }

    if (isRateLimited(session.walletAddress)) {
      socket.emit('chat:error', {
        code: 'RATE_LIMITED',
        message: `Too many messages. Max ${RATE_LIMIT_MAX_MESSAGES} per ${RATE_LIMIT_WINDOW_MS / 1000}s.`,
      });
      return;
    }

    const content = sanitizeMessage(payload.content || '');
    if (!content) return;

    const message = {
      id: crypto.randomUUID(),
      roomId: session.roomId,
      walletAddress: session.walletAddress,
      walletType: session.walletType,
      nickname: session.nickname,
      avatar: session.avatar,
      content,
      timestamp: new Date().toISOString(),
    };

    store.addMessage(session.roomId, message);
    io.to(session.roomId).emit('chat:message', message);
  });

  socket.on('disconnect', () => {
    store.removeSession(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`SN1 backend socket server listening on :${PORT}`);
});
