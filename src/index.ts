import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import studioRoutes from './routes/studio.routes';
import bookingRoutes from './routes/booking.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000'],
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'StudioSpace Server is running smoothly! 🚀',
  });
});

// Start Server and Connect DB
async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Server] Running without active MongoDB connection for now. Please provide MONGODB_URI in .env');
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
  });
}

startServer();
