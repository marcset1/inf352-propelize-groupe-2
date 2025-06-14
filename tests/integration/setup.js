import { beforeAll, afterAll } from 'vitest';

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const sequelize = new Sequelize(
  'test_vehicle_db',
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    //logging: msg => logger.debug(msg),
  }
);


// 4. Vérification de la configuration
console.log('[TEST SETUP] Configuration DB:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  dialect: process.env.DB_DIALECT
});

// 5. Initialisation des tests
beforeAll(async () => {
  try {
    // Vérification que l'instance Sequelize est correcte
    if (!sequelize || !sequelize.options) {
      throw new Error('Instance Sequelize mal initialisée');
    }

    // Authentification explicite
    await sequelize.authenticate();
    
    // Sync en mode test seulement (force: true pour une DB propre)
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
    }

    console.log(`[TEST SETUP] Connecté à ${sequelize.options.database} sur ${sequelize.options.host}:${sequelize.options.port}`);
  } catch (error) {
    console.error('[TEST SETUP] Erreur d\'initialisation:', error);
    throw error;
  }
});

// 6. Nettoyage après tests
afterAll(async () => {
  await sequelize.close();
});
