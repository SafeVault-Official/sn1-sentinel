import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { createInMemoryStore } from './store.js';
import { baseRooms } from './rooms.js';
import { backendEnv } from './config.js';

import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import { httpRateLimiter } from './middleware/rateLimiter.js';
import { createSystemRouter } from './routes/systemRoutes.js';
import { attachChatHandlers } from './sockets/chatSocket.js';
import { notFoundHandler } from './utils/errors.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: backendEnv.corsOrigins.includes('*')
      ? '*'
      : backendEnv.corsOrigins,
  },
});

app.use(
  cors({
    origin: backendEnv.corsOrigins.includes('*')
      ? true
      : backendEnv.corsOrigins,
  })
);

app.use(express.json());
app.use(requestLogger);
app.use(httpRateLimiter);

const store = createInMemoryStore();
baseRooms.forEach((room) => store.ensureRoom(room));

/**
 * Routes
 */
app.use(createSystemRouter({ store }));

/**
 * Error handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Socket.io
 */
io.on('connection', (socket) => {
  logger.info('Socket connected', { socketId: socket.id });

  attachChatHandlers({
    io,
    socket,
    store,
  });
});

/**
 * Start server
 */
httpServer.listen(backendEnv.port, () => {
  logger.info(`SN1 backend socket server listening on :${backendEnv.port}`);
});