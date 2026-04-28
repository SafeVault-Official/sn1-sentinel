import { resolveRoom } from '../rooms.js';
import { canAccessRoom } from '../blockchainAdapter.js';
import { SOCKET_CHAT_RATE_LIMIT } from '../config/constants.js';
import { buildChatMessage, sanitizeMessage } from '../services/chatService.js';
import { createRateLimiter } from '../services/rateLimitService.js';
import { validateJoinPayload, validateMessagePayload } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';

const chatLimiter = createRateLimiter({
  windowMs: SOCKET_CHAT_RATE_LIMIT.windowMs,
  maxEvents: SOCKET_CHAT_RATE_LIMIT.maxMessages,
});

export const attachChatHandlers = ({ io, socket, store }) => {
  socket.on('chat:join', async (payload = {}) => {
    try {
      const validation = validateJoinPayload(payload);
      if (!validation.ok) {
        socket.emit('chat:error', validation.error);
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
    } catch (error) {
      logger.error('chat:join failed', { socketId: socket.id, error: error.message });
      socket.emit('chat:error', { code: 'INTERNAL_SERVER_ERROR', message: 'Could not join room.' });
    }
  });

  socket.on('chat:message', (payload = {}) => {
    try {
      const session = store.getSession(socket.id);
      const validation = validateMessagePayload(payload, session);
      if (!validation.ok) {
        socket.emit('chat:error', validation.error);
        return;
      }

      if (chatLimiter.isLimited(session.walletAddress)) {
        socket.emit('chat:error', {
          code: 'RATE_LIMITED',
          message: `Too many messages. Max ${SOCKET_CHAT_RATE_LIMIT.maxMessages} per ${SOCKET_CHAT_RATE_LIMIT.windowMs / 1000}s.`,
        });
        return;
      }

      const content = sanitizeMessage(payload.content || '');
      if (!content) return;

      const message = buildChatMessage({ session, content });
      store.addMessage(session.roomId, message);
      io.to(session.roomId).emit('chat:message', message);
    } catch (error) {
      logger.error('chat:message failed', { socketId: socket.id, error: error.message });
      socket.emit('chat:error', { code: 'INTERNAL_SERVER_ERROR', message: 'Could not send message.' });
    }
  });

  socket.on('disconnect', () => {
    store.removeSession(socket.id);
    logger.info('Socket disconnected', { socketId: socket.id });
  });
};
