export const ROOM_TYPES = {
  PUBLIC: 'public',
  TOKEN_GATED: 'token-gated',
};

export const baseRooms = [
  {
    id: 'global',
    name: 'Global Chat',
    type: ROOM_TYPES.PUBLIC,
    requirements: null,
  },
  {
    id: 'snl1-holders',
    name: 'SNL1 Holders',
    type: ROOM_TYPES.TOKEN_GATED,
    requirements: { tokenSymbol: 'SNL1', minBalance: 1_000 },
  },
  {
    id: 'whales',
    name: 'Whale Lounge',
    type: ROOM_TYPES.TOKEN_GATED,
    requirements: { tokenSymbol: 'SNL1', minBalance: 50_000 },
  },
];

export const getDynamicTokenRoom = (roomId) => {
  if (!roomId?.startsWith('token:')) return null;
  const symbol = roomId.split(':')[1]?.trim()?.toUpperCase();
  if (!symbol) return null;

  return {
    id: roomId,
    name: `${symbol} Token Room`,
    type: ROOM_TYPES.TOKEN_GATED,
    requirements: { tokenSymbol: symbol, minBalance: 1 },
  };
};

export const resolveRoom = (roomId) => {
  const room = baseRooms.find((candidate) => candidate.id === roomId);
  return room || getDynamicTokenRoom(roomId);
};
