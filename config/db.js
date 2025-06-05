import { Sequelize } from 'sequelize';
import logger from '../middleware/logger.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
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
    await sequelize.sync(); // Creates tables if they don't exist
    logger.info('PostgreSQL Connected');
  } catch (error) {
    logger.error('PostgreSQL Connection Error:', error);
    process.exit(1);
  }
};

export default sequelize;
