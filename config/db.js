//config/db.js
import { Sequelize } from 'sequelize';
import logger from '../middleware/logger.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const isTestEnv = process.env.NODE_ENV === 'test';

// Configure database connection based on environment
const sequelize = new Sequelize(

  process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_NAME || 'test_vehicle_db'
    : process.env.DB_NAME || 'vehicle_db',
  process.env.DB_USER || 'test_user',
  process.env.DB_PASSWORD || 'test_password',

  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: msg => logger.debug(msg),
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: isTestEnv }); // Force sync in test env to reset DB
    logger.info(`PostgreSQL Connected (${isTestEnv ? 'Test' : 'Production'} Environment)`);
  } catch (error) {
    logger.error('PostgreSQL Connection Error:', error);
    process.exit(1);
  }
};

export default sequelize;
