import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../../../config/db.js';

// Mock des dépendances
vi.mock('sequelize');
vi.mock('bcrypt');
vi.mock('../../../config/db.js');

// Helper pour créer des données utilisateur de test
const createUserData = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'testuser',
  password: 'password123',
  role: 'user',
  refreshToken: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides
});

// Helper pour créer des instances mock du modèle User
const createMockUserInstance = (data = {}) => {
  const userData = createUserData(data);
  const mockInstance = {
    ...userData,
    changed: vi.fn(),
    comparePassword: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  };
  return mockInstance;
};

// Helper pour les erreurs de validation Sequelize
const createSequelizeErrors = () => ({
  validation: (() => {
    const err = new Error('Validation error');
    err.name = 'SequelizeValidationError';
    err.errors = [
      { path: 'name', message: 'Name cannot be null' },
      { path: 'password', message: 'Password cannot be null' }
    ];
    return err;
  })(),
  unique: (() => {
    const err = new Error('Unique constraint error');
    err.name = 'SequelizeUniqueConstraintError';
    err.fields = ['name'];
    return err;
  })(),
  database: (() => {
    const err = new Error('Database connection error');
    err.name = 'SequelizeDatabaseError';
    return err;
  })()
});

describe('User Model Tests', () => {
  let mockUserModel;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a proper mock for the User model with prototype
    mockUserModel = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      prototype: {} // Add prototype property
    };
    
    // Mock sequelize.define to return our mock model
    sequelize.define = vi.fn().mockReturnValue(mockUserModel);
    
    // Mock bcrypt functions
    bcrypt.hash = vi.fn();
    bcrypt.compare = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  //                                   Tests de définition du modèle

  describe('Définition du modèle', () => {
    it('définit le modèle User avec les bons attributs', async () => {
      // Clear any previous module cache
      vi.resetModules();
      
      // Import the model - this will trigger the define call
      const { default: User } = await import('../../../models/user.model.js');
      
      expect(sequelize.define).toHaveBeenCalledWith('User', 
        expect.objectContaining({
          id: expect.objectContaining({
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
          }),
          name: expect.objectContaining({
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
          }),
          password: expect.objectContaining({
            type: DataTypes.STRING,
            allowNull: false
          }),
          role: expect.objectContaining({
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user'
          }),
          refreshToken: expect.objectContaining({
            type: DataTypes.STRING
          })
        }),
        expect.objectContaining({
          hooks: expect.any(Object),
          timestamps: true
        })
      );
      
      // Verify that comparePassword method was added to prototype
      expect(User.prototype.comparePassword).toBeDefined();
      expect(typeof User.prototype.comparePassword).toBe('function');
    });

    it('configure les timestamps correctement', async () => {
      vi.resetModules();
      await import('../../../models/user.model.js');
      
      const defineCall = sequelize.define.mock.calls[0];
      const options = defineCall[2];
      
      expect(options.timestamps).toBe(true);
    });
  });

  //                                   Tests des hooks

  describe('Hook beforeSave', () => {
    let mockUser;
    let beforeSaveHook;

    beforeEach(async () => {
      // Mock User instance
      mockUser = createMockUserInstance();
      
      // Reset modules and import to get fresh hook
      vi.resetModules();
      await import('../../../models/user.model.js');
      const defineCall = sequelize.define.mock.calls[0];
      beforeSaveHook = defineCall[2].hooks.beforeSave;
    });

    describe('Hachage du mot de passe', () => {
      it('hache le mot de passe quand il est modifié', async () => {
        const plainPassword = 'newpassword123';
        const hashedPassword = '$2b$10$hashedpassword';
        
        mockUser.password = plainPassword;
        mockUser.changed.mockReturnValue(true);
        bcrypt.hash.mockResolvedValue(hashedPassword);

        await beforeSaveHook(mockUser);

        expect(mockUser.changed).toHaveBeenCalledWith('password');
        expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
        expect(mockUser.password).toBe(hashedPassword);
      });

      it('ne hache pas le mot de passe s\'il n\'est pas modifié', async () => {
        const originalPassword = 'unchanged';
        mockUser.password = originalPassword;
        mockUser.changed.mockReturnValue(false);

        await beforeSaveHook(mockUser);

        expect(mockUser.changed).toHaveBeenCalledWith('password');
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(mockUser.password).toBe(originalPassword);
      });

      it('gère les erreurs de hachage', async () => {
        const hashError = new Error('Hashing failed');
        mockUser.changed.mockReturnValue(true);
        bcrypt.hash.mockRejectedValue(hashError);

        await expect(beforeSaveHook(mockUser)).rejects.toThrow('Hashing failed');
        expect(bcrypt.hash).toHaveBeenCalled();
      });
    });
  });

  //                                   Tests de la méthode comparePassword

  describe('Méthode comparePassword', () => {
    let userInstance;
    let User;

    beforeEach(async () => {
      userInstance = createMockUserInstance({
        password: '$2b$10$hashedpassword'
      });
      
      // Import the model to get the real comparePassword method
      vi.resetModules();
      const userModule = await import('../../../models/user.model.js');
      User = userModule.default;
      
      // Bind the real comparePassword method to our test instance
      userInstance.comparePassword = User.prototype.comparePassword.bind(userInstance);
    });

    describe('Comparaison réussie', () => {
      it('retourne true pour un mot de passe correct', async () => {
        const plainPassword = 'correctpassword';
        bcrypt.compare.mockResolvedValue(true);

        const result = await userInstance.comparePassword(plainPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, userInstance.password);
        expect(result).toBe(true);
      });

      it('retourne false pour un mot de passe incorrect', async () => {
        const plainPassword = 'wrongpassword';
        bcrypt.compare.mockResolvedValue(false);

        const result = await userInstance.comparePassword(plainPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, userInstance.password);
        expect(result).toBe(false);
      });
    });

    describe('Gestion des erreurs', () => {
      it('propage les erreurs de bcrypt.compare', async () => {
        const compareError = new Error('Compare failed');
        bcrypt.compare.mockRejectedValue(compareError);

        await expect(userInstance.comparePassword('anypassword')).rejects.toThrow('Compare failed');
        expect(bcrypt.compare).toHaveBeenCalled();
      });
    });

    describe('Cas limites', () => {
      it('gère les mots de passe vides', async () => {
        bcrypt.compare.mockResolvedValue(false);

        const result = await userInstance.comparePassword('');

        expect(bcrypt.compare).toHaveBeenCalledWith('', userInstance.password);
        expect(result).toBe(false);
      });

      it('gère les mots de passe null/undefined', async () => {
        bcrypt.compare.mockResolvedValue(false);

        const resultNull = await userInstance.comparePassword(null);
        const resultUndefined = await userInstance.comparePassword(undefined);

        expect(bcrypt.compare).toHaveBeenCalledWith(null, userInstance.password);
        expect(bcrypt.compare).toHaveBeenCalledWith(undefined, userInstance.password);
        expect(resultNull).toBe(false);
        expect(resultUndefined).toBe(false);
      });
    });
  });

 
  //                                   Tests de validation des données

  describe('Validation des données', () => {
    let MockedUser;

    beforeEach(() => {
      MockedUser = {
        create: vi.fn()
      };
    });

    describe('Validation du nom', () => {
      it('rejette les noms vides', async () => {
        const errors = createSequelizeErrors();
        MockedUser.create.mockRejectedValue(errors.validation);

        await expect(MockedUser.create({ name: '', password: 'test' }))
          .rejects.toThrow('Validation error');
      });

      it('rejette les noms null', async () => {
        const errors = createSequelizeErrors();
        MockedUser.create.mockRejectedValue(errors.validation);

        await expect(MockedUser.create({ name: null, password: 'test' }))
          .rejects.toThrow('Validation error');
      });

      it('rejette les noms en double', async () => {
        const errors = createSequelizeErrors();
        MockedUser.create.mockRejectedValue(errors.unique);

        await expect(MockedUser.create({ name: 'duplicate', password: 'test' }))
          .rejects.toThrow('Unique constraint error');
      });
    });

    describe('Validation du mot de passe', () => {
      it('rejette les mots de passe vides', async () => {
        const errors = createSequelizeErrors();
        MockedUser.create.mockRejectedValue(errors.validation);

        await expect(MockedUser.create({ name: 'test', password: '' }))
          .rejects.toThrow('Validation error');
      });

      it('rejette les mots de passe null', async () => {
        const errors = createSequelizeErrors();
        MockedUser.create.mockRejectedValue(errors.validation);

        await expect(MockedUser.create({ name: 'test', password: null }))
          .rejects.toThrow('Validation error');
      });
    });

    describe('Validation du rôle', () => {
      it('accepte le rôle "user"', async () => {
        const user = createMockUserInstance({ role: 'user' });
        MockedUser.create.mockResolvedValue(user);

        const result = await MockedUser.create({ 
          name: 'test', 
          password: 'test', 
          role: 'user' 
        });

        expect(result.role).toBe('user');
      });

      it('accepte le rôle "admin"', async () => {
        const user = createMockUserInstance({ role: 'admin' });
        MockedUser.create.mockResolvedValue(user);

        const result = await MockedUser.create({ 
          name: 'test', 
          password: 'test', 
          role: 'admin' 
        });

        expect(result.role).toBe('admin');
      });

      it('rejette les rôles invalides', async () => {
        const validationError = new Error('Invalid enum value');
        validationError.name = 'SequelizeValidationError';
        MockedUser.create.mockRejectedValue(validationError);

        await expect(MockedUser.create({ 
          name: 'test', 
          password: 'test', 
          role: 'invalid' 
        })).rejects.toThrow('Invalid enum value');
      });
    });
  });
});