// utils/initializeDatabase.js
import logger from '../middleware/logger.js';
import { connectDB } from '../config/db.js';
import { seedVehicles } from '../data/seedData.js';


export const initializeDatabase = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Then seed the database with initial data
    await seedVehicles();
    
    logger.info('Database initialized and seeded successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
};