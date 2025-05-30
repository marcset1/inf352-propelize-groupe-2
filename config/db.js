import { Sequelize } from 'sequelize';
import logger from '../middleware/logger.js';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'vehicle_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'jackkevin',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
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