import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import venueRoutes from './routes/venue.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use('/api/fests', venueRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Festify API Server running on http://localhost:${PORT}`);
});

