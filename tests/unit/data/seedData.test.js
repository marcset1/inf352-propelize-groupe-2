import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { seedVehicles, seedUsers, seedAll } from '../../../data/seedData.js';
import User from '../../../models/user.model.js';
import Vehicle from '../../../models/vehicle.model.js';
import logger from '../../../middleware/logger.js';
import bcrypt from 'bcrypt';

// Mock global des dépendances
vi.mock('../../models/user.model.js');
vi.mock('../../models/vehicle.model.js');
vi.mock('../../middleware/logger.js');
vi.mock('bcrypt');

// Helper pour les erreurs de base de données communes
const createDatabaseErrors = () => ({
  connection: new Error('Database connection failed'),
  timeout: (() => {
    const err = new Error('Query timeout');
    err.name = 'SequelizeTimeoutError';
    return err;
  })(),
  unique: (() => {
    const err = new Error('Unique constraint error');
    err.name = 'SequelizeUniqueConstraintError';
    return err;
  })(),
  validation: (() => {
    const err = new Error('Validation error');
    err.name = 'SequelizeValidationError';
    err.errors = [{ message: 'Field is required' }];
    return err;
  })()
});

describe('Seed Data Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.info = vi.fn();
    logger.error = vi.fn();
    bcrypt.hashSync = vi.fn().mockReturnValue('hashedPassword');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('seedVehicles', () => {
    it('seed les véhicules quand la base est vide', async () => {
      Vehicle.count = vi.fn().mockResolvedValue(0);
      Vehicle.bulkCreate = vi.fn().mockResolvedValue();

      await seedVehicles();

      expect(Vehicle.count).toHaveBeenCalled();
      expect(Vehicle.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            marque: expect.any(String),
            model: expect.any(String),
            immatriculation: expect.stringMatching(/^ABC-\d+$/),
            annees: expect.any(Number),
            prixLocation: expect.any(Number)
          })
        ])
      );
      expect(logger.info).toHaveBeenCalledWith('Seeding database with initial vehicle data...');
      expect(logger.info).toHaveBeenCalledWith('Database seeded with 10 vehicles');
    });

    it('ne seed pas si des véhicules existent déjà', async () => {
      Vehicle.count = vi.fn().mockResolvedValue(5);
      Vehicle.bulkCreate = vi.fn();

      await seedVehicles();

      expect(Vehicle.count).toHaveBeenCalled();
      expect(Vehicle.bulkCreate).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('gère l\'erreur connection lors du count', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockRejectedValue(errors.connection);

      await expect(seedVehicles()).rejects.toThrow(errors.connection);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.connection);
    });

    it('gère l\'erreur timeout lors du count', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockRejectedValue(errors.timeout);

      await expect(seedVehicles()).rejects.toThrow(errors.timeout);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.timeout);
    });

    it('gère l\'erreur unique lors du count', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockRejectedValue(errors.unique);

      await expect(seedVehicles()).rejects.toThrow(errors.unique);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.unique);
    });

    it('gère l\'erreur validation lors du count', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockRejectedValue(errors.validation);

      await expect(seedVehicles()).rejects.toThrow(errors.validation);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.validation);
    });

    it('gère l\'erreur connection lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockResolvedValue(0);
      Vehicle.bulkCreate = vi.fn().mockRejectedValue(errors.connection);

      await expect(seedVehicles()).rejects.toThrow(errors.connection);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.connection);
    });

    it('gère l\'erreur timeout lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockResolvedValue(0);
      Vehicle.bulkCreate = vi.fn().mockRejectedValue(errors.timeout);

      await expect(seedVehicles()).rejects.toThrow(errors.timeout);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.timeout);
    });

    it('gère l\'erreur unique lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockResolvedValue(0);
      Vehicle.bulkCreate = vi.fn().mockRejectedValue(errors.unique);

      await expect(seedVehicles()).rejects.toThrow(errors.unique);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.unique);
    });

    it('gère l\'erreur validation lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      Vehicle.count = vi.fn().mockResolvedValue(0);
      Vehicle.bulkCreate = vi.fn().mockRejectedValue(errors.validation);

      await expect(seedVehicles()).rejects.toThrow(errors.validation);
      expect(logger.error).toHaveBeenCalledWith('Error seeding vehicles:', errors.validation);
    });
  });

  describe('seedUsers', () => {
    it('seed les utilisateurs quand la base est vide', async () => {
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockResolvedValue();

      await seedUsers();

      expect(User.count).toHaveBeenCalled();
      expect(User.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'admin',
            password: 'hashedPassword',
            role: 'admin'
          })
        ])
      );
      expect(bcrypt.hashSync).toHaveBeenCalledWith('admin123', 10);
      expect(logger.info).toHaveBeenCalledWith('Seeding database with initial user data...');
      expect(logger.info).toHaveBeenCalledWith('Database seeded with 5 users');
      expect(logger.info).toHaveBeenCalledWith('Test admin credentials - email: admin@example.com, password: admin123');
    });

    it('ne seed pas si des utilisateurs existent déjà', async () => {
      User.count = vi.fn().mockResolvedValue(3);
      User.bulkCreate = vi.fn();

      await seedUsers();

      expect(User.count).toHaveBeenCalled();
      expect(User.bulkCreate).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('génère le bon nombre d\'utilisateurs avec les bons rôles', async () => {
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockResolvedValue();

      await seedUsers();

      const [seedData] = User.bulkCreate.mock.calls[0];
      
      // Vérifier qu'il y a bien 5 utilisateurs
      expect(seedData).toHaveLength(5);
      
      // Vérifier que le premier est l'admin connu
      expect(seedData[0]).toEqual({
        name: 'admin',
        password: 'hashedPassword',
        role: 'admin'
      });
      
      // Vérifier que tous ont des propriétés requises
      seedData.forEach(user => {
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('password');
        expect(user).toHaveProperty('role');
        expect(['admin', 'user']).toContain(user.role);
      });
    });

    it('gère l\'erreur connection lors du count', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockRejectedValue(errors.connection);

      await expect(seedUsers()).rejects.toThrow(errors.connection);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.connection);
    });

    it('gère l\'erreur timeout lors du count', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockRejectedValue(errors.timeout);

      await expect(seedUsers()).rejects.toThrow(errors.timeout);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.timeout);
    });

    it('gère l\'erreur unique lors du count', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockRejectedValue(errors.unique);

      await expect(seedUsers()).rejects.toThrow(errors.unique);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.unique);
    });

    it('gère l\'erreur validation lors du count', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockRejectedValue(errors.validation);

      await expect(seedUsers()).rejects.toThrow(errors.validation);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.validation);
    });

    it('gère l\'erreur connection lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockRejectedValue(errors.connection);

      await expect(seedUsers()).rejects.toThrow(errors.connection);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.connection);
    });

    it('gère l\'erreur timeout lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockRejectedValue(errors.timeout);

      await expect(seedUsers()).rejects.toThrow(errors.timeout);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.timeout);
    });

    it('gère l\'erreur unique lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockRejectedValue(errors.unique);

      await expect(seedUsers()).rejects.toThrow(errors.unique);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.unique);
    });

    it('gère l\'erreur validation lors du bulkCreate', async () => {
      const errors = createDatabaseErrors();
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockRejectedValue(errors.validation);

      await expect(seedUsers()).rejects.toThrow(errors.validation);
      expect(logger.error).toHaveBeenCalledWith('Error seeding users:', errors.validation);
    });
  });

  describe('seedAll', () => {
    it('seed users et vehicles avec succès', async () => {
      // Mock seedUsers
      User.count = vi.fn().mockResolvedValue(0);
      User.bulkCreate = vi.fn().mockResolvedValue();
      
      // Mock seedVehicles
      Vehicle.count = vi.fn().mockResolvedValue(0);
      Vehicle.bulkCreate = vi.fn().mockResolvedValue();

      await seedAll();

      expect(User.count).toHaveBeenCalled();
      expect(User.bulkCreate).toHaveBeenCalled();
      expect(Vehicle.count).toHaveBeenCalled();
      expect(Vehicle.bulkCreate).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database seeding completed successfully');
    });

    it('gère les erreurs lors du seed des users', async () => {
      const testError = new Error('User seeding failed');
      User.count = vi.fn().mockRejectedValue(testError);

      await expect(seedAll()).rejects.toThrow(testError);
      expect(logger.error).toHaveBeenCalledWith('Database seeding failed:', testError);
    });

    it('gère les erreurs lors du seed des vehicles', async () => {
      const testError = new Error('Vehicle seeding failed');
      
      // Mock successful user seeding
      User.count = vi.fn().mockResolvedValue(1); // Users already exist
      
      // Mock failed vehicle seeding
      Vehicle.count = vi.fn().mockRejectedValue(testError);

      await expect(seedAll()).rejects.toThrow(testError);
      expect(logger.error).toHaveBeenCalledWith('Database seeding failed:', testError);
    });
  });
});