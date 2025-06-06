// tests/setup.js
import { beforeAll, afterAll, beforeEach } from 'vitest'; // Importez beforeEach
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // Nécessaire pour __dirname en module ES

// Pour simuler __dirname en environnement ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Chargement spécifique pour les tests
// Assurez-vous que le chemin vers .env.test est correct
// Si .env.test est à la racine de votre projet :
dotenv.config({
  path: path.resolve(__dirname, '.env.test'), // Remonte deux niveaux pour la racine du projet
  override: true // Écrase les variables existantes
});
// Ou si .env.test est dans le dossier tests/ :
// dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

// Vérification essentielle : s'assurer que nous sommes bien en environnement de test
// Cela empêche le script de setup de s'exécuter dans un environnement non-test par erreur.
if (process.env.NODE_ENV !== 'test') {
  console.error("ERREUR: Ce setup est uniquement destiné aux tests. Veuillez définir NODE_ENV=test.");
  process.exit(1); // Arrête le processus
}

// Assurez-vous que DB_NAME est bien défini dans .env.test
const dbName = process.env.DB_NAME || 'test_vehicle_db'; // Utilisez la variable d'env, avec un fallback

const sequelize = new Sequelize(
  dbName, // Utilisez la variable d'environnement
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'postgres', // Utilisez la variable d'env pour le dialecte aussi
    logging: false, // Désactive le logging SQL par défaut pour les tests, active si besoin de débogage
    // Ajoutez d'autres options si nécessaire, comme un pool de connexions réduit pour les tests
  }
);

// Pour l'import de vos modèles Sequelize
// Vous devrez importer tous vos modèles ici pour qu'ils soient synchronisés
// Exemple:
// import VehicleModel from '../models/vehicle.model.js'; // Ajustez le chemin
// import UserModel from '../models/user.model.js'; // Ajustez le chemin

// 4. Vérification de la configuration (informations non sensibles)
console.log('[TEST SETUP] Connexion DB:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: dbName,
  user: process.env.DB_USER ? '********' : 'UNDEFINED', // Ne pas logguer le nom d'utilisateur complet
  dialect: process.env.DB_DIALECT
});

// 5. Initialisation des tests (une fois avant tous les tests)
beforeAll(async () => {
  try {
    if (!sequelize || !sequelize.options) {
      throw new Error('Instance Sequelize mal initialisée.');
    }

    await sequelize.authenticate();
    console.log(`[TEST SETUP] Authentifié à la base de données.`);

    // Synchronisation forcée pour une base de données propre au début de la suite
    // Cela créera/recréera toutes les tables basées sur vos modèles définis dans Sequelize
    await sequelize.sync({ force: true });
    console.log(`[TEST SETUP] Base de données '${sequelize.options.database}' synchronisée et nettoyée.`);

  } catch (error) {
    console.error('[TEST SETUP] Erreur lors de l\'initialisation des tests:', error);
    throw error; // Propager l'erreur pour que Vitest échoue
  }
});

// Nettoyage avant chaque test
beforeEach(async () => {
    // Très important pour l'isolation des tests !
    // Si vous avez des seeders, vous les exécuteriez ici pour des données de base
    // await seedTestData(); // Exemple

    // Option 1 (plus rapide) : Vider les tables au lieu de les resynchroniser entièrement
    // Cela nécessite d'importer vos modèles et de les vider un par un
    // Exemple (à adapter avec vos vrais modèles) :
    // await VehicleModel.destroy({ truncate: true, cascade: true });
    // await UserModel.destroy({ truncate: true, cascade: true });

    // Option 2 (plus simple mais potentiellement plus lent) : Resynchroniser à chaque fois
    // Cela recrée toutes les tables avant chaque test. Peut être très lent pour de nombreux tests.
    // Utilisez cette option si la performance n'est pas un problème majeur ou si vous avez des dépendances complexes entre tables.
    await sequelize.sync({ force: true });
});

// 6. Nettoyage après tous les tests
afterAll(async () => {
  console.log('[TEST TEARDOWN] Fermeture de la connexion DB.');
  await sequelize.close();
});

// Exportez l'instance sequelize si d'autres parties de vos tests en ont besoin,
// bien que souvent, Vitest gère le setup de manière transparente.
// export { sequelize };
