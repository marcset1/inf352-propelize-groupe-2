import User from '../models/user.model.js';
import Vehicle from '../models/vehicle.model.js';
import logger from '../middleware/logger.js';
import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';

// Configuration des données de seed
const SEED_CONFIG = {
  users: {
    count: 10,
    adminCount: 2
  },
  vehicles: {
    count: 20
  }
};

// Données de base pour la génération aléatoire
const SEED_DATA = {
  vehicles: {
    marques: [
      "Toyota", "Mercedes-Benz", "Audi", "Ford", "Nissan", 
      "BMW", "Volkswagen", "Hyundai", "Kia", "Renault",
      "Peugeot", "Citroën", "Mazda", "Subaru", "Volvo"
    ],
    models: {
      "Toyota": ["Camry", "Corolla", "RAV4", "Prius", "Highlander"],
      "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLA", "GLC"],
      "Audi": ["A3", "A4", "Q5", "e-tron", "Q7"],
      "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Ranger"],
      "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder", "Titan"],
      "BMW": ["3 Series", "5 Series", "X3", "X5", "i4"],
      "Volkswagen": ["Golf", "Passat", "Tiguan", "Atlas", "ID.4"],
      "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona"],
      "Kia": ["Forte", "Optima", "Sorento", "Sportage", "Stinger"],
      "Renault": ["Clio", "Megane", "Captur", "Koleos", "Talisman"],
      "Peugeot": ["208", "308", "3008", "5008", "Partner"],
      "Citroën": ["C3", "C4", "C5", "Aircross", "Berlingo"],
      "Mazda": ["Mazda3", "CX-5", "CX-9", "MX-5", "CX-30"],
      "Subaru": ["Impreza", "Outback", "Forester", "Ascent", "WRX"],
      "Volvo": ["XC60", "XC90", "S60", "V60", "XC40"]
    },
    annees: [2020, 2021, 2022, 2023, 2024, 2025],
    couleurs: ["Noir", "Blanc", "Gris", "Rouge", "Bleu", "Argent"],
    carburants: ["Essence", "Diesel", "Hybride", "Électrique"]
  },
  users: {
    prenoms: [
      "Alexandre", "Marie", "Pierre", "Sophie", "Jean", "Emma", "Paul", "Clara",
      "Antoine", "Léa", "Thomas", "Camille", "Nicolas", "Julie", "Maxime", "Sarah",
      "Lucas", "Manon", "Hugo", "Chloé", "Arthur", "Laura", "Louis", "Margot",
      "Gabriel", "Alice", "Raphaël", "Jade", "Adam", "Lola"
    ],
    noms: [
      "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit",
      "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel",
      "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel",
      "Girard", "André", "Lefèvre", "Mercier", "Dupont", "Lambert", "Bonnet",
      "François", "Martinez"
    ],
    domaines: ["gmail.com", "yahoo.fr", "outlook.com", "hotmail.com", "orange.fr"]
  }
};

// Génération des données véhicules
const generateVehicleData = (count = SEED_CONFIG.vehicles.count) => {
  const { marques, models, annees, couleurs, carburants } = SEED_DATA.vehicles;
  const seedData = [];
  const usedImmatriculations = new Set();
  
  for (let i = 0; i < count; i++) {
    const marque = marques[Math.floor(Math.random() * marques.length)];
    const modelsForMarque = models[marque] || ["Model Unknown"];
    const model = modelsForMarque[Math.floor(Math.random() * modelsForMarque.length)];
    const annee = annees[Math.floor(Math.random() * annees.length)];
    const couleur = couleurs[Math.floor(Math.random() * couleurs.length)];
    const carburant = carburants[Math.floor(Math.random() * carburants.length)];
    
    // Génération d'une immatriculation unique
    let immatriculation;
    do {
      const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                     String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                     String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const numbers = String(Math.floor(Math.random() * 900) + 100);
      immatriculation = `${letters}-${numbers}`;
    } while (usedImmatriculations.has(immatriculation));
    
    usedImmatriculations.add(immatriculation);
    
    // Prix basé sur l'année et la marque
    let basePrix = 30;
    if (["Mercedes-Benz", "BMW", "Audi"].includes(marque)) basePrix = 60;
    if (["Toyota", "Nissan", "Ford"].includes(marque)) basePrix = 40;
    
    const ageFactor = Math.max(0.5, (annee - 2018) / 7); // Facteur d'âge
    const randomFactor = 0.8 + Math.random() * 0.4; // Variation aléatoire
    const prixLocation = Math.round(basePrix * ageFactor * randomFactor);
    
    seedData.push({
      marque,
      model,
      immatriculation,
      annees: annee,
      prixLocation,
      couleur,
      carburant,
      disponible: Math.random() > 0.2 // 80% de chance d'être disponible
    });
  }
  
  return seedData;
};

// Génération des données utilisateurs
const generateUserData = (count = SEED_CONFIG.users.count, adminCount = SEED_CONFIG.users.adminCount) => {
  const { prenoms, noms, domaines } = SEED_DATA.users;
  const seedData = [];
  const usedEmails = new Set();
  const usedUsernames = new Set();
  
  // Créer un admin principal connu
  seedData.push({
    name: 'admin',
    email: 'admin@example.com',
    password: 'admin123', // Sera hashé par le hook beforeSave
    role: 'admin',
    firstName: 'Administrateur',
    lastName: 'Principal',
    phone: '+33123456789'
  });
  usedEmails.add('admin@example.com');
  usedUsernames.add('admin');
  
  // Créer des utilisateurs aléatoires
  for (let i = 1; i < count; i++) {
    const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
    const nom = noms[Math.floor(Math.random() * noms.length)];
    const domaine = domaines[Math.floor(Math.random() * domaines.length)];
    
    // Générer un nom d'utilisateur unique
    let username;
    do {
      const variation = Math.floor(Math.random() * 999);
      username = `${prenom.toLowerCase()}.${nom.toLowerCase()}${variation > 0 ? variation : ''}`;
    } while (usedUsernames.has(username));
    usedUsernames.add(username);
    
    // Générer un email unique
    let email;
    do {
      const variation = Math.floor(Math.random() * 999);
      email = `${prenom.toLowerCase()}.${nom.toLowerCase()}${variation > 0 ? variation : ''}@${domaine}`;
    } while (usedEmails.has(email));
    usedEmails.add(email);
    
    // Déterminer le rôle (garantir le nombre d'admins souhaité)
    const role = i < adminCount ? 'admin' : (Math.random() > 0.85 ? 'admin' : 'user');
    
    // Générer un mot de passe simple pour les tests
    const password = `${prenom}123`;
    
    // Générer un numéro de téléphone français
    const phone = `+336${Math.floor(Math.random() * 90000000) + 10000000}`;
    
    seedData.push({
      name: username,
      email,
      password, // Sera hashé par le hook beforeSave
      role,
      firstName: prenom,
      lastName: nom,
      phone
    });
  }
  
  return seedData;
};

// Fonction de seed pour les véhicules
export const seedVehicles = async () => {
  try {
    const count = await Vehicle.count();
    
    if (count === 0) {
      const seedData = generateVehicleData();
      logger.info('🚗 Seeding database with initial vehicle data...');
      
      await Vehicle.bulkCreate(seedData, {
        validate: true,
        individualHooks: false
      });
      
      logger.info(`✅ Database seeded with ${seedData.length} vehicles`);
      
      // Log quelques exemples pour debug
      const samples = seedData.slice(0, 3);
      logger.info('Sample vehicles created:', JSON.stringify(samples, null, 2));
    } else {
      logger.info(`ℹ️  Vehicles table already contains ${count} records, skipping seed`);
    }
  } catch (error) {
    logger.error('❌ Error seeding vehicles:', error);
    throw error;
  }
};

// Fonction de seed pour les utilisateurs
export const seedUsers = async () => {
  try {
    // S'assurer que les tables sont synchronisées
    await sequelize.sync();
    
    const count = await User.count();
    
    if (count === 0) {
      const seedData = generateUserData();
      logger.info('👥 Seeding database with initial user data...');
      
      // Créer les utilisateurs un par un pour permettre au hook beforeSave de fonctionner
      const createdUsers = [];
      for (const userData of seedData) {
        try {
          const user = await User.create(userData);
          createdUsers.push(user);
        } catch (userError) {
          logger.error(`Error creating user ${userData.name}:`, userError.message);
        }
      }
      
      logger.info(`✅ Database seeded with ${createdUsers.length} users`);
      
      // Log des informations de connexion pour le développement
      logger.info('🔑 Test credentials:');
      logger.info('   Admin: admin@example.com / admin123');
      
      // Log quelques utilisateurs de test
      const testUsers = seedData.filter(u => u.role === 'user').slice(0, 2);
      testUsers.forEach(user => {
        logger.info(`   User: ${user.email} / ${user.password}`);
      });
      
    } else {
      logger.info(`ℹ️  Users table already contains ${count} records, skipping seed`);
    }
  } catch (error) {
    logger.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Fonction de nettoyage (utile pour les tests)
export const clearDatabase = async () => {
  try {
    logger.info('🧹 Clearing database...');
    
    // Supprimer dans l'ordre inverse des dépendances
    await Vehicle.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    
    logger.info('✅ Database cleared successfully');
  } catch (error) {
    logger.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Fonction de re-seed (nettoie puis recrée)
export const reseedDatabase = async () => {
  try {
    await clearDatabase();
    await seedAll();
    logger.info('🔄 Database reseeded successfully');
  } catch (error) {
    logger.error('❌ Error reseeding database:', error);
    throw error;
  }
};

// Fonction principale de seed
export const seedAll = async () => {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Synchroniser les modèles avec la base de données
    await sequelize.sync();
    
    // Seeder dans l'ordre des dépendances
    await seedUsers();
    logger.info('🎉 USERS seeding completed successfully');
    await seedVehicles();
    
    logger.info('🎉 Database seeding completed successfully');
    
    // Statistiques finales
    const userCount = await User.count();
    const vehicleCount = await Vehicle.count();
    const adminCount = await User.count({ where: { role: 'admin' } });
    
    logger.info(`📊 Final stats: ${userCount} users (${adminCount} admins), ${vehicleCount} vehicles`);
    
  } catch (error) {
    logger.error('💥 Database seeding failed:', error);
    throw error;
  }
};

// Fonction utilitaire pour créer un utilisateur admin rapidement
export const createAdminUser = async (name, email, password) => {
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.warn(`User with email ${email} already exists`);
      return existingUser;
    }
    
    const admin = await User.create({
      name,
      email,
      password, // Sera hashé automatiquement
      role: 'admin',
      firstName: name.split('.')[0] || name,
      lastName: name.split('.')[1] || 'Admin'
    });
    
    logger.info(`👑 Admin user created: ${email}`);
    return admin;
  } catch (error) {
    logger.error('Error creating admin user:', error);
    throw error;
  }
};

// Export par défaut
export default {
  seedAll,
  seedUsers,
  seedVehicles,
  clearDatabase,
  reseedDatabase,
  createAdminUser,
  SEED_CONFIG
};