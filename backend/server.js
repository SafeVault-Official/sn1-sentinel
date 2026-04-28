import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

const db = {
  users: new Map(),
  profiles: new Map(),
  messages: [],
};

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'sn1-chat-backend' });
});

io.on('connection', (socket) => {
  let walletAddress = '';

  socket.on('chat:join', (profile) => {
    walletAddress = profile.address;
    db.users.set(walletAddress, { walletAddress, connectedAt: new Date().toISOString() });
    db.profiles.set(walletAddress, profile);
    socket.emit('chat:history', db.messages.slice(-120));
  });

  socket.on('chat:message', ({ content }) => {
    if (!walletAddress) return;

    const profile = db.profiles.get(walletAddress);
    const message = {
      id: crypto.randomUUID(),
      walletAddress,
      avatar: profile?.avatar,
      content,
      timestamp: new Date().toISOString(),
    };

    db.messages.push(message);
    io.emit('chat:message', message);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`SN1 backend socket server listening on :${PORT}`);
});
