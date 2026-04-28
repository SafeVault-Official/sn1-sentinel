const MAX_MESSAGES_PER_ROOM = 250;

export const createInMemoryStore = () => {
  const sessions = new Map(); // socketId -> session
  const users = new Map(); // walletAddress -> profile
  const rooms = new Map(); // roomId -> room metadata
  const messagesByRoom = new Map();

  const ensureRoom = (room) => {
    if (!rooms.has(room.id)) {
      rooms.set(room.id, room);
    }
    if (!messagesByRoom.has(room.id)) {
      messagesByRoom.set(room.id, []);
    }
  };

  const upsertSession = (socketId, session) => {
    sessions.set(socketId, session);
    users.set(session.walletAddress, {
      walletAddress: session.walletAddress,
      walletType: session.walletType,
      avatar: session.avatar || null,
      nickname: session.nickname || '',
      lastSeen: new Date().toISOString(),
    });
  };

  const getSession = (socketId) => sessions.get(socketId);

  const removeSession = (socketId) => sessions.delete(socketId);

  const addMessage = (roomId, message) => {
    const roomMessages = messagesByRoom.get(roomId) || [];
    roomMessages.push(message);
    if (roomMessages.length > MAX_MESSAGES_PER_ROOM) {
      roomMessages.shift();
    }
    messagesByRoom.set(roomId, roomMessages);
  };

  const getRoomHistory = (roomId, limit = 120) => {
    const roomMessages = messagesByRoom.get(roomId) || [];
    return roomMessages.slice(-limit);
  };

  return {
    ensureRoom,
    upsertSession,
    getSession,
    removeSession,
    addMessage,
    getRoomHistory,
    get rooms() {
      return rooms;
    },
    get users() {
      return users;
    },
  };
};
