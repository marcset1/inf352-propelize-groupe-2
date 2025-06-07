import express from 'express';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';

// Import utilities
import logger from './middleware/logger.js';

// Import database and seeders
import { connectDB } from './config/db.js';
import { seedAll } from './data/seedData.js'; // Modification ici pour utiliser seedAll

// Import routes
import vehicleRoutes from './routes/vehicle.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

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

var allowedOrigins = [ 'http://localhost:3000','https://propelize.onrender.com']
let corsOptions = {
    credentials: true,
    origin: function(origin, callback) {
        if(allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }else {
            callback(new Error('Not allowed by cors'));
        }
    },
    methods: ["GET, POST, PUT, DELETE"],
  }


app.use(
  cors( corsOptions
))

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vehicles', vehicleRoutes); 

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
