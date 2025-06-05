import logger from '../middleware/logger.js';
import { connectDB } from '../config/db.js';
import { seedAll } from '../data/seedData.js';

const initializeTestDatabase = async () => {
  try {
    await connectDB();
    await seedAll();
    logger.info('Test database initialized and seeded successfully.');
  } catch (error) {
    logger.error('Failed to initialize test database:', error);
    throw error;
  }
};

export { initializeTestDatabase };