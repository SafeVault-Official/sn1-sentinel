import { MESSAGE_MAX_LENGTH } from '../config/constants.js';

export const sanitizeMessage = (value = '') =>
  value
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MESSAGE_MAX_LENGTH);

export const buildChatMessage = ({ session, content }) => ({
  id: crypto.randomUUID(),
  roomId: session.roomId,
  walletAddress: session.walletAddress,
  walletType: session.walletType,
  nickname: session.nickname,
  avatar: session.avatar,
  content,
  timestamp: new Date().toISOString(),
});
