const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const apiRoutes = require('./routes/apiRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const { initChatSockets } = require('./sockets/chat');

const app = express();
const server = http.createServer(app);

// Allow Cross-Origin Requests
const allowedOrigin = process.env.FRONTEND_URL || '*';
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

// Setup express security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: allowedOrigin
}));

// Parse JSON payload
app.use(express.json());

// Main App Router API
app.use('/api', apiRoutes);
app.use('/api/trade', tradeRoutes);

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


