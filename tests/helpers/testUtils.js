import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../../models/user.model.js';
import Vehicle from '../../models/vehicle.model.js';
import sequelize, { connectDB, clearTestDB, closeDB } from '../../config/db.js';

// Configuration des utilisateurs de test
export const testUsers = {
  admin: {
    name: 'testadmin',
    password: 'admin123',
    role: 'admin'
  },
  user: {
    name: 'testuser',
    password: 'user123',
    role: 'user'
  }
};

// Générer un token JWT pour les tests
export const generateTestToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
};

// Créer des utilisateurs de test en base
export const createTestUsers = async () => {
    const users = {};
       
    for (const [key, userData] of Object.entries(testUsers)) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Utiliser findOrCreate pour éviter les conflits de clés uniques
      const [user, created] = await User.findOrCreate({
        where: { name: userData.name },
        defaults: {
          name: userData.name,
          password: hashedPassword,
          role: userData.role
        }
      });
      
      users[key] = user;
    }
       
    return users;
  };

// Créer des véhicules de test
export const createTestVehicles = async (count = 3) => {
    const vehicles = [];
       
    for (let i = 0; i < count; i++) {
      // Ajouter un timestamp pour rendre les immatriculations uniques
      const timestamp = Date.now();
      const uniqueId = `${timestamp}-${i}`;
      
      const [vehicle, created] = await Vehicle.findOrCreate({
        where: { immatriculation: `TEST-${100 + i}-${uniqueId}` },
        defaults: {
          marque: `TestMarque${i}`,
          model: `TestModel${i}`,
          immatriculation: `TEST-${100 + i}-${uniqueId}`,
          annees: 2020 + i,
          prixLocation: 1000 + (i * 100)
        }
      });
      
      vehicles.push(vehicle);
    }
       
    return vehicles;
  };
  
// Setup de base pour tous les tests
export const setupTestDatabase = async () => {
  await connectDB();
  await clearTestDB();
};

// Nettoyage après les tests
export const teardownTestDatabase = async () => {
  await clearTestDB();
  await closeDB();
};

// Helper pour les tokens d'authentification
export const getAuthHeaders = (user) => {
  const token = generateTestToken(user);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper pour créer un contexte de test complet
export const createTestContext = async () => {
  await setupTestDatabase();
  const users = await createTestUsers();
  const vehicles = await createTestVehicles();
  
  return {
    users,
    vehicles,
    tokens: {
      admin: generateTestToken(users.admin),
      user: generateTestToken(users.user)
    }
  };
};