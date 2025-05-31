// import { Sequelize } from 'sequelize';
// import logger from '../middleware/logger.js';
// import dotenv from 'dotenv';

// dotenv.config();

// const isTest = process.env.NODE_ENV === 'test';

// if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
//   throw new Error('Missing database configuration in environment variables');
// }

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST || 'localhost',
//     port: process.env.DB_PORT || 5432,
//     dialect: 'postgres',
//     logging: isTest ? false : msg => logger.debug(msg),
//   }
// );

// export const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     await sequelize.sync();
//     logger.info('PostgreSQL Connected');
//   } catch (error) {
//     logger.error(`PostgreSQL Connection Error: ${error.message}`, { error });
//     console.log('PostgreSQL Connection Error:', error);
//     process.exit(1);
//   }
// };

// export default sequelize;
import { Sequelize } from 'sequelize';
import logger from '../middleware/logger.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration des environnements
const isTest = process.env.NODE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration par défaut avec validation
const getDbConfig = () => {
  const config = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres'
  };

  // Validation des variables obligatoires
  const requiredVars = ['DB_NAME', 'DB_USER'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error('💡 Please check your .env file and ensure these variables are set:');
    missingVars.forEach(varName => {
      logger.error(`   ${varName}=your_value_here`);
    });
    throw new Error(`Missing database configuration: ${missingVars.join(', ')}`);
  }

  // Avertissement pour mot de passe manquant (peut être vide en développement)
  if (!process.env.DB_PASSWORD && isProduction) {
    throw new Error('DB_PASSWORD is required in production environment');
  }

  if (!process.env.DB_PASSWORD && !isProduction) {
    logger.warn('⚠️  DB_PASSWORD is not set (OK for development with trust authentication)');
  }

  return config;
};

// Récupération de la configuration
const dbConfig = getDbConfig();

// Configuration Sequelize avec options optimisées
const sequelizeOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  
  // Logging configuré selon l'environnement
  logging: isTest ? false : 
          isDevelopment ? (msg) => logger.debug(msg) : 
          false,
  
  // Pool de connexions optimisé
  pool: {
    max: isProduction ? 20 : 5,      // Plus de connexions en prod
    min: 0,
    acquire: 30000,                   // 30 secondes pour acquérir une connexion
    idle: 10000,                      // 10 secondes avant fermeture d'une connexion inactive
    evict: 1000,                      // Vérification des connexions inactives chaque seconde
  },
  
  // Configuration des modèles par défaut
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: false,
    paranoid: false,                  // Soft delete désactivé par défaut
  },
  
  // Options de connexion PostgreSQL
  dialectOptions: {
    connectTimeout: 60000,            // 60 secondes pour la connexion
    requestTimeout: 30000,            // 30 secondes pour les requêtes
    ...(isProduction && {
      ssl: {
        require: true,
        rejectUnauthorized: false     // Pour les certificats auto-signés
      }
    })
  },
  
  // Retry automatique
  retry: {
    max: 3,
    timeout: 5000,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /TIMEOUT/,
    ]
  }
};

// Création de l'instance Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  sequelizeOptions
);

// Fonction pour créer la base de données si elle n'existe pas
const createDatabaseIfNotExists = async () => {
  if (process.env.DB_AUTO_CREATE !== 'true') {
    return; // Ne pas créer automatiquement si pas explicitement demandé
  }

  logger.info('🔍 Checking if database exists...');
  
  // Connexion à la base de données par défaut pour créer la DB cible
  const adminSequelize = new Sequelize(
    'postgres', // Base de données par défaut PostgreSQL
    dbConfig.username,
    dbConfig.password,
    {
      ...sequelizeOptions,
      logging: false // Pas de log pour les opérations admin
    }
  );

  try {
    await adminSequelize.authenticate();
    
    // Vérifier si la base de données existe
    const [results] = await adminSequelize.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      {
        bind: [dbConfig.database],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (results.length === 0) {
      logger.info(`📝 Creating database: ${dbConfig.database}`);
      await adminSequelize.query(`CREATE DATABASE "${dbConfig.database}"`);
      logger.info('✅ Database created successfully');
    } else {
      logger.info('✅ Database already exists');
    }
    
  } catch (error) {
    logger.warn(`⚠️  Could not auto-create database: ${error.message}`);
    logger.info('💡 You may need to create the database manually:');
    logger.info(`   CREATE DATABASE "${dbConfig.database}";`);
  } finally {
    await adminSequelize.close();
  }
};

// Fonction pour gérer les ENUMs PostgreSQL
const handlePostgreSQLEnums = async () => {
  try {
    // Créer les ENUMs nécessaires s'ils n'existent pas
    const enumQueries = [
      `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
                CREATE TYPE "public"."enum_Users_role" AS ENUM('user', 'admin');
            END IF;
        END$$;
      `
    ];

    for (const query of enumQueries) {
      await sequelize.query(query);
    }
    
    logger.debug('✅ PostgreSQL ENUMs handled successfully');
  } catch (error) {
    logger.warn('⚠️  Could not create ENUMs:', error.message);
    logger.info('💡 This might cause issues with ENUM fields in your models');
  }
};

// Fonction principale de connexion
export const connectDB = async () => {
  try {
    logger.info('🔄 Connecting to PostgreSQL database...');
    logger.info(`📍 Connection details: ${dbConfig.username}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    // Étape 1: Créer la base de données si nécessaire
    await createDatabaseIfNotExists();
    
    // Étape 2: Tester la connexion
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    
    // Étape 3: Gérer les ENUMs PostgreSQL
    await handlePostgreSQLEnums();
    logger.info('✅ gère les enums');

    
    // Étape 4: Synchroniser les modèles
    const syncOptions = {
      // En développement, on peut utiliser alter pour mettre à jour les tables
      alter: isDevelopment && process.env.DB_ALTER_TABLES === 'true',
      // Force recréation seulement si explicitement demandé (DANGER en prod!)
      force: isDevelopment && process.env.DB_FORCE_SYNC === 'true'
    };
    
    if (syncOptions.force) {
      logger.warn('⚠️  FORCE SYNC enabled - This will DROP and RECREATE all tables!');
    }
    
    // await sequelize.sync(syncOptions);
    
    if (syncOptions.alter) {
      logger.info('🔄 Database schema updated (ALTER mode)');
    } else if (syncOptions.force) {
      logger.info('🔄 Database schema recreated (FORCE mode)');
    } else {
      logger.info('✅ Database schema validated');
    }
    
    // Étape 5: Log des informations de connexion
    const dbVersion = await sequelize.query('SELECT version()', { 
      type: Sequelize.QueryTypes.SELECT 
    });
    logger.info(`📊 PostgreSQL version: ${dbVersion[0].version.split(' ')[1]}`);
    
    // Compter les tables existantes
    const [tables] = await sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    logger.info(`📋 Database contains ${tables[0].count} tables`);
    
    logger.info('🎉 Database initialization completed successfully');
    
  } catch (error) {
    logger.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    
    // Diagnostic avancé selon le type d'erreur
    if (error.message.includes('ECONNREFUSED')) {
      logger.error('💡 PostgreSQL server is not running. Start it with:');
      logger.error('   • Windows: net start postgresql');
      logger.error('   • macOS: brew services start postgresql');
      logger.error('   • Linux: sudo systemctl start postgresql');
      logger.error('   • Docker: docker start postgres-container');
    } else if (error.message.includes('authentication failed')) {
      logger.error('💡 Authentication failed. Check your credentials:');
      logger.error(`   • Username: ${dbConfig.username}`);
      logger.error('   • Password: Check DB_PASSWORD in .env');
      logger.error('   • Try: psql -U ' + dbConfig.username + ' -d postgres');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      logger.error('💡 Database does not exist. Solutions:');
      logger.error(`   • Set DB_AUTO_CREATE=true in .env`);
      logger.error(`   • Or create manually: CREATE DATABASE "${dbConfig.database}";`);
    } else if (error.message.includes('timeout')) {
      logger.error('💡 Connection timeout. Check:');
      logger.error('   • Network connectivity');
      logger.error('   • PostgreSQL server status');
      logger.error('   • Firewall settings');
    }
    
    logger.error('🔧 For more help, run: npm run db:diagnose');
    
    // En développement, on peut être moins strict
    if (!isProduction && process.env.DB_IGNORE_ERRORS === 'true') {
      logger.warn('⚠️  Continuing despite database errors (DB_IGNORE_ERRORS=true)');
      return;
    }
    
    throw error;
  }
};

// Fonction pour fermer proprement la connexion
export const closeDB = async () => {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error.message);
  }
};

// Fonction pour vérifier la santé de la base de données
export const checkDBHealth = async () => {
  try {
    await sequelize.authenticate();
    const startTime = Date.now();
    await sequelize.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      connections: {
        active: sequelize.connectionManager.pool.size,
        idle: sequelize.connectionManager.pool.available.length,
        total: sequelize.connectionManager.pool.options.max
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Gestion propre de l'arrêt de l'application
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, closing database connection...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, closing database connection...');
  await closeDB();
  process.exit(0);
});

// Export par défaut
export default sequelize;