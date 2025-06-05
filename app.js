import express from 'express';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';
import cors from 'cors';


// Import utilities
import logger from './middleware/logger.js';

// Import database and seeders
import { connectDB } from './config/db.js';
import { seedAll } from './data/seedData.js'; // Modification ici pour utiliser seedAll

// Import routes
import vehicleRoutes from './routes/vehicle.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';


const app = express();

// Initialize database and seed data
const initializeApp = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Then seed the database with initial data (users and vehicles)
    await seedAll(); // Modification ici pour seed users et vehicles
    
    logger.info('Database initialized and seeded successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
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
    message: "Vehicle Rental API Service",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Initialize the application
initializeApp();

export { app };
