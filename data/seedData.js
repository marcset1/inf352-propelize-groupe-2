import User from '../models/user.model.js';
import Vehicle from '../models/vehicle.model.js';
import logger from '../middleware/logger.js';
import bcrypt from 'bcrypt';

// Generate random vehicle data (existing)
const generateVehicleData = () => {
  const marques = ["Toyota", "Mercedes", "Audi", "Ford", "Nissan"];
  const models = ["Camry", "Benz", "E-tron", "F-150", "Altima"];
  const annees = [2022, 2023, 2024, 2025, 2026];

  const seedData = [];
  
  for (let i = 0; i < 10; i++) {
    const randomMarque = marques[Math.floor(Math.random() * marques.length)];
    const randomModel = models[Math.floor(Math.random() * models.length)];
    const randomAnnee = annees[Math.floor(Math.random() * annees.length)];
    const randomPrixLocation = Math.floor(Math.random() * 351) + 1500;
    
    seedData.push({
      marque: randomMarque,
      model: randomModel,
      immatriculation: `ABC-${100 + i}`,
      annees: randomAnnee,
      prixLocation: randomPrixLocation
    });
  }
  
  return seedData;
};

// Generate random user data (new)
const generateUserData = (count = 5) => {
  const firstNames = ["Alex", "Jamie", "Taylor", "Morgan", "Casey", "Riley", "Jordan"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"];
  const domains = ["example.com", "test.com", "demo.com", "mail.com"];
  const roles = ["user", "admin"];

  const seedData = [];
  
  // Always create a known admin user first
  seedData.push({
    name: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  });

  // Generate random users
  for (let i = 0; i < count - 1; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const role = i === 0 ? 'admin' : 'user'; // Ensure at least 2 admins
    
    seedData.push({
      name: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      password: bcrypt.hashSync(`${firstName}123`, 10),
      role: Math.random() > 0.8 ? roles[0] : role // 20% chance of admin
    });
  }
  
  return seedData;
};

// Seed vehicles (existing)
export const seedVehicles = async () => {
  try {
    const count = await Vehicle.count();
    
    if (count === 0) {
      const seedData = generateVehicleData();
      logger.info('Seeding database with initial vehicle data...');
      await Vehicle.bulkCreate(seedData);
      logger.info(`Database seeded with ${seedData.length} vehicles`);
    }
  } catch (error) {
    logger.error('Error seeding vehicles:', error);
    throw error;
  }
};

// Seed users (new)
export const seedUsers = async () => {
  try {
    const count = await User.count();
    
    if (count === 0) {
      const seedData = generateUserData(5); // Generate 5 users (1 known admin + 4 random)
      logger.info('Seeding database with initial user data...');
      await User.bulkCreate(seedData);
      logger.info(`Database seeded with ${seedData.length} users`);
      
      // Log the test admin credentials for development
      logger.info('Test admin credentials - email: admin@example.com, password: admin123');
    }
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Master seed function
export const seedAll = async () => {
  try {
    await seedUsers();
    await seedVehicles();
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};
