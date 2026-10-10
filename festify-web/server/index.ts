import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import venueRoutes from './routes/venue.js';
import notificationRoutes from './routes/notifications.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { initSocketServer } from './socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.IO server
initSocketServer(server);

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', notificationRoutes);
app.use('/api/fests', venueRoutes);

server.listen(PORT, () => {
  console.log(`🚀 Festify Real-Time API Server running on http://localhost:${PORT}`);
});
