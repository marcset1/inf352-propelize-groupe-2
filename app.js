//app.js
import express from 'express';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';
import cors from 'cors';

// Import utilities
import logger from './middleware/logger.js';
import { connectDB } from './config/db.js';
import { seedAll } from './data/seedData.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';


const app = express();

// Initialize database and seed data
export const initializeApp = async () => {
  try {
    await connectDB();
    if (process.env.NODE_ENV === 'test') {
      await seedAll(); // Seed only in test environment
    }
    logger.info('Database initialized and seeded successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

// Middlewares
app.use(pinoHttp({ logger }));
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/vehicles', vehicleRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Vehicle Rental API Service',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Initialize app only if not in test environment or explicitly required
if (process.env.NODE_ENV !== 'test') {
  initializeApp().catch(error => {
    logger.error('Application initialization failed:', error);
    process.exit(1);
  });
}

export { app };