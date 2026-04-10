const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const apiRoutes = require('./routes/apiRoutes');
const { initChatSockets } = require('./sockets/chat');

const app = express();
const server = http.createServer(app);

// Allow Cross-Origin Requests properly in dev and production
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup express security
app.use(helmet());
app.use(cors());

// Parse JSON payload
app.use(express.json());

// Main App Router API
app.use('/api', apiRoutes);

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// Initialize real-time E2EE messaging sockets
initChatSockets(io);

// Boot server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Medora Backend] running natively on http://localhost:${PORT}`);
  console.log(`[WebSocket] E2EE chat enabled and waiting connections.`);
});


