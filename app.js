import dotenv from 'dotenv';
import express from 'express';
import pinoHttp from 'pino-http';
import cors from 'cors';
import logger from './middleware/logger.js';
import { connectDB } from './config/db.js';
import { seedAll } from './data/seedData.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['NODE_ENV', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Log environment details
logger.info('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ? 'set' : 'unset',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ? 'set' : 'unset'
});

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
    logger.error('Failed to initialize database:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Middlewares
app.use(pinoHttp({ logger }));
app.use(express.json());
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
  logger.error('Unhandled error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Initialize app only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeApp().catch(error => {
    logger.error('Application initialization failed:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export { app };