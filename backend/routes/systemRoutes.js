import { Router } from 'express';

export const createSystemRouter = ({ store }) => {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'sn1-chat-backend',
      usersOnline: Array.from(store.users.values()).length,
      rooms: Array.from(store.rooms.values()),
    });
  });

  router.get('/rooms', (_req, res) => {
    res.json({ rooms: Array.from(store.rooms.values()) });
  });

  return router;
};
