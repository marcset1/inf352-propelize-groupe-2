import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getCurrentUser
} from '../../../controllers/user.controller.js';
import User from '../../../models/user.model.js';
import logger from '../../../middleware/logger.js';

// Mock global des dépendances
vi.mock('../models/user.model.js');
vi.mock('../middleware/logger.js');

// Helper pour créer des mocks de req/res
const createMockReqRes = () => {
  const mockStatus = vi.fn().mockReturnThis();
  const mockJson = vi.fn().mockReturnThis();
  const mockSend = vi.fn().mockReturnThis();
  
  return {
    mockReq: { 
      body: {}, 
      params: {},
      user: { id: 1, role: 'admin' } // User par défaut (admin)
    },
    mockRes: {
      status: mockStatus,
      json: mockJson,
      send: mockSend
    },
    mockStatus,
    mockJson,
    mockSend
  };
};

// Helper pour créer des utilisateurs de test
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'testuser',
  role: 'user',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
});

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
    err.errors = [{ message: 'Name is required' }];
    return err;
  })(),
  sql: (() => {
    const err = new Error('Invalid SQL query');
    err.name = 'SequelizeDatabaseError';
    return err;
  })()
});

describe('User Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.info = vi.fn();
    logger.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  //                                   Tests pour la fonction createUser

  describe('createUser', () => {
    describe('Succès', () => {
      it('crée un utilisateur avec tous les champs', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        const userData = {
          name: 'testuser',
          password: 'password123',
          role: 'user'
        };
        mockReq.body = userData;
        const createdUser = createMockUser(userData);
        
        User.findOne = vi.fn().mockResolvedValue(null);
        User.create = vi.fn().mockResolvedValue(createdUser);

        await createUser(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
        expect(User.create).toHaveBeenCalledWith(userData);
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith({
          id: createdUser.id,
          name: createdUser.name,
          role: createdUser.role,
          createdAt: createdUser.createdAt
        });
        expect(logger.info).toHaveBeenCalledWith(`User created by admin: ${userData.name}`);
      });

      it('applique le rôle par défaut "user"', async () => {
        const { mockReq, mockRes, mockStatus } = createMockReqRes();
        mockReq.body = {
          name: 'testuser',
          password: 'password123'
        };
        
        User.findOne = vi.fn().mockResolvedValue(null);
        User.create = vi.fn().mockResolvedValue(createMockUser());

        await createUser(mockReq, mockRes);

        expect(User.create).toHaveBeenCalledWith({
          name: 'testuser',
          password: 'password123',
          role: 'user'
        });
        expect(mockStatus).toHaveBeenCalledWith(201);
      });
    });

    describe('Erreurs de validation', () => {
      it('retourne 400 si le nom est manquant', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.body = { password: 'password123' };

        await createUser(mockReq, mockRes);

        expect(User.findOne).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          error: "Name and password are required"
        });
      });

      it('retourne 400 si le mot de passe est manquant', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.body = { name: 'testuser' };

        await createUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          error: "Name and password are required"
        });
      });

      it('retourne 409 si l\'utilisateur existe déjà', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.body = { name: 'existinguser', password: 'password123' };
        
        User.findOne = vi.fn().mockResolvedValue(createMockUser({ name: 'existinguser' }));

        await createUser(mockReq, mockRes);

        expect(User.create).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(409);
        expect(mockJson).toHaveBeenCalledWith({ error: "Username already in use" });
      });
    });

    describe('Erreurs de base de données', () => {
      const errors = createDatabaseErrors();

      it('retourne 400 pour erreur de validation Sequelize', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.body = { name: 'testuser', password: 'password123' };
        
        User.findOne = vi.fn().mockResolvedValue(null);
        User.create = vi.fn().mockRejectedValue(errors.validation);

        await createUser(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith('Create user error:', errors.validation);
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          error: "Validation error",
          details: ['Name is required']
        });
      });

      ['connection', 'timeout', 'sql'].forEach(errorType => {
        it(`retourne 500 pour erreur ${errorType}`, async () => {
          const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
          mockReq.body = { name: 'testuser', password: 'password123' };
          
          User.findOne = vi.fn().mockResolvedValue(null);
          User.create = vi.fn().mockRejectedValue(errors[errorType]);

          await createUser(mockReq, mockRes);

          expect(logger.error).toHaveBeenCalledWith('Create user error:', errors[errorType]);
          expect(mockStatus).toHaveBeenCalledWith(500);
          expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
        });
      });
    });
  });

  //                                   Tests pour la fonction getUsers

  describe('getUsers', () => {
    describe('Succès', () => {
      it('retourne tous les utilisateurs', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        const mockUsers = [
          createMockUser({ id: 1, name: 'user1' }),
          createMockUser({ id: 2, name: 'user2', role: 'admin' })
        ];
        User.findAll = vi.fn().mockResolvedValue(mockUsers);

        await getUsers(mockReq, mockRes);

        expect(User.findAll).toHaveBeenCalledWith({
          attributes: ['id', 'name', 'role', 'createdAt'],
          order: [['createdAt', 'DESC']]
        });
        expect(mockJson).toHaveBeenCalledWith(mockUsers);
      });

      it('retourne une liste vide si aucun utilisateur', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        User.findAll = vi.fn().mockResolvedValue([]);

        await getUsers(mockReq, mockRes);

        expect(mockJson).toHaveBeenCalledWith([]);
      });
    });

    describe('Erreurs de base de données', () => {
      const errors = createDatabaseErrors();

      ['connection', 'timeout', 'sql'].forEach(errorType => {
        it(`gère l'erreur ${errorType}`, async () => {
          const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
          User.findAll = vi.fn().mockRejectedValue(errors[errorType]);

          await getUsers(mockReq, mockRes);

          expect(logger.error).toHaveBeenCalledWith('Get users error:', errors[errorType]);
          expect(mockStatus).toHaveBeenCalledWith(500);
          expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
        });
      });
    });
  });

  //                                   Tests pour la fonction getUser

  describe('getUser', () => {
    describe('Succès', () => {
      it('permet à un admin d\'accéder à n\'importe quel profil', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        mockReq.params.id = '2';
        mockReq.user = { id: 1, role: 'admin' };
        const mockUser = createMockUser({ id: 2 });
        User.findByPk = vi.fn().mockResolvedValue(mockUser);

        await getUser(mockReq, mockRes);

        expect(User.findByPk).toHaveBeenCalledWith('2', {
          attributes: ['id', 'name', 'role', 'createdAt']
        });
        expect(mockJson).toHaveBeenCalledWith(mockUser);
      });

      it('permet à un utilisateur d\'accéder à son propre profil', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        mockReq.params.id = '1';
        mockReq.user = { id: 1, role: 'user' };
        const mockUser = createMockUser({ id: 1 });
        User.findByPk = vi.fn().mockResolvedValue(mockUser);

        await getUser(mockReq, mockRes);

        expect(mockJson).toHaveBeenCalledWith(mockUser);
      });
    });

    describe('Utilisateur non trouvé', () => {
      it('retourne 404 pour utilisateur inexistant', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '999';
        User.findByPk = vi.fn().mockResolvedValue(null);

        await getUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: "User not found" });
      });
    });

    describe('Erreurs d\'autorisation', () => {
      it('retourne 403 si un utilisateur non-admin essaie d\'accéder au profil d\'un autre', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '2';
        mockReq.user = { id: 1, role: 'user' };
        const mockUser = createMockUser({ id: 2 });
        User.findByPk = vi.fn().mockResolvedValue(mockUser);

        await getUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized access" });
      });
    });

    describe('Erreurs de base de données', () => {
      const errors = createDatabaseErrors();

      ['connection', 'sql', 'timeout'].forEach(errorType => {
        it(`gère l'erreur ${errorType}`, async () => {
          const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
          mockReq.params.id = '1';
          User.findByPk = vi.fn().mockRejectedValue(errors[errorType]);

          await getUser(mockReq, mockRes);

          expect(logger.error).toHaveBeenCalledWith('Get user error:', errors[errorType]);
          expect(mockStatus).toHaveBeenCalledWith(500);
          expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
        });
      });
    });
  });

  //                                   Tests pour la fonction updateUser

  describe('updateUser', () => {
    describe('Succès', () => {
      it('permet à un admin de mettre à jour n\'importe quel utilisateur', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        mockReq.params.id = '2';
        mockReq.body = { name: 'updatedname', role: 'admin' };
        mockReq.user = { id: 1, role: 'admin' };
        const existingUser = createMockUser({ id: 2 });
        const updatedUser = createMockUser({ id: 2, name: 'updatedname', role: 'admin' });

        User.findByPk = vi.fn()
          .mockResolvedValueOnce(existingUser)
          .mockResolvedValueOnce(updatedUser);
        User.update = vi.fn().mockResolvedValue();

        await updateUser(mockReq, mockRes);

        expect(User.update).toHaveBeenCalledWith(
          { name: 'updatedname', role: 'admin' },
          { where: { id: '2' } }
        );
        expect(mockJson).toHaveBeenCalledWith(updatedUser);
        expect(logger.info).toHaveBeenCalledWith(`User updated: ${updatedUser.name}`);
      });

      it('permet à un utilisateur de mettre à jour son propre profil (sans rôle)', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        
        mockReq.params.id = '1';
        mockReq.body = { name: 'updatedname'}; // role should be ignored
        mockReq.user = { id: '1', role: 'user' }; // matching ID as string
        
        const existingUser = createMockUser({ id: '1' }); // ensure ID is string
        const updatedUser = createMockUser({ id: '1', name: 'updatedname' });
        
        // Mock the database calls
        User.findByPk = vi.fn()
          .mockResolvedValueOnce(existingUser)   // first call - check user exists
          .mockResolvedValueOnce(updatedUser);   // second call - return updated user
          
        User.update = vi.fn().mockResolvedValue([1]); // Sequelize returns [number of affected rows]
        
        await updateUser(mockReq, mockRes);
        
        // Verify the update was called with correct parameters
        expect(User.update).toHaveBeenCalledWith(
          { name: 'updatedname' }, // role should be excluded
          { where: { id: '1' } }
        );
        
        // Verify the response
        expect(mockJson).toHaveBeenCalledWith(updatedUser);
      });
    });

    describe('Utilisateur non trouvé', () => {
      it('retourne 404 pour utilisateur inexistant', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '999';
        mockReq.body = { name: 'test' };
        User.findByPk = vi.fn().mockResolvedValue(null);

        await updateUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: "User not found" });
      });
    });

    describe('Erreurs d\'autorisation', () => {
      it('retourne 403 si un utilisateur non-admin essaie de modifier un autre utilisateur', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '2';
        mockReq.body = { name: 'test' };
        mockReq.user = { id: 1, role: 'user' };
        const existingUser = createMockUser({ id: 2 });
        User.findByPk = vi.fn().mockResolvedValue(existingUser);

        await updateUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized access" });
      });

      it('retourne 403 si un admin essaie de changer son propre rôle', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '1';
        mockReq.body = { role: 'user' };
        mockReq.user = { id: 1, role: 'admin' };
        const existingUser = createMockUser({ id: 1, role: 'admin' });
        User.findByPk = vi.fn().mockResolvedValue(existingUser);

        await updateUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ error: "Cannot change your own role" });
      });
    });

    describe('Validation', () => {
      it('retourne 400 si aucun champ valide à mettre à jour', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '1';
        mockReq.body = {};
        mockReq.user = { id: 1, role: 'admin' };
        const existingUser = createMockUser({ id: 1 });
        User.findByPk = vi.fn().mockResolvedValue(existingUser);

        await updateUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: "No valid fields to update" });
      });
    });

    describe('Erreurs de base de données', () => {
      const errors = createDatabaseErrors();

      it('retourne 409 pour contrainte d\'unicité', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '1';
        mockReq.body = { name: 'existingname' };
        mockReq.user = { id: 1, role: 'admin' };
        const existingUser = createMockUser({ id: 1 });
        
        User.findByPk = vi.fn().mockResolvedValue(existingUser);
        User.update = vi.fn().mockRejectedValue(errors.unique);

        await updateUser(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith('Update user error:', errors.unique);
        expect(mockStatus).toHaveBeenCalledWith(409);
        expect(mockJson).toHaveBeenCalledWith({ error: "Username already in use" });
      });

      ['connection', 'timeout', 'sql'].forEach(errorType => {
        it(`gère l'erreur ${errorType}`, async () => {
          const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
          mockReq.params.id = '1';
          mockReq.body = { name: 'test' };
          mockReq.user = { id: 1, role: 'admin' };
          const existingUser = createMockUser({ id: 1 });
          
          User.findByPk = vi.fn().mockResolvedValue(existingUser);
          User.update = vi.fn().mockRejectedValue(errors[errorType]);

          await updateUser(mockReq, mockRes);

          expect(logger.error).toHaveBeenCalledWith('Update user error:', errors[errorType]);
          expect(mockStatus).toHaveBeenCalledWith(500);
          expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
        });
      });
    });
  });

  //                                   Tests pour la fonction deleteUser

  describe('deleteUser', () => {
    describe('Succès', () => {
      it('supprime un utilisateur existant', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '2';
        mockReq.user = { id: 1, role: 'admin' };
        const userToDelete = createMockUser({ id: 2, name: 'userToDelete' });
        
        User.findByPk = vi.fn().mockResolvedValue(userToDelete);
        User.destroy = vi.fn().mockResolvedValue(1);

        await deleteUser(mockReq, mockRes);

        expect(User.destroy).toHaveBeenCalledWith({ where: { id: '2' } });
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
          message: `${userToDelete.name} has been successfully deleted`
        });
        expect(logger.info).toHaveBeenCalledWith(`User deleted: ${userToDelete.name}`);
      });
    });

    describe('Utilisateur non trouvé', () => {
      it('retourne 404 pour utilisateur inexistant', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '999';
        User.findByPk = vi.fn().mockResolvedValue(null);

        await deleteUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: "User not found" });
      });
    });

    describe('Erreurs d\'autorisation', () => {
      it('retourne 403 si un utilisateur essaie de supprimer son propre compte', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '1';
        mockReq.user = { id: 1, role: 'admin' };
        const userToDelete = createMockUser({ id: 1 });
        User.findByPk = vi.fn().mockResolvedValue(userToDelete);

        await deleteUser(mockReq, mockRes);

        expect(User.destroy).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(403);
        expect(mockJson).toHaveBeenCalledWith({ error: "Cannot delete your own account" });
      });
    });

    describe('Erreurs de base de données', () => {
      it('gère les erreurs de suppression', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '2';
        mockReq.user = { id: 1, role: 'admin' };
        const userToDelete = createMockUser({ id: 2 });
        const dbError = new Error('Delete failed');
        
        User.findByPk = vi.fn().mockResolvedValue(userToDelete);
        User.destroy = vi.fn().mockRejectedValue(dbError);

        await deleteUser(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith('Delete user error:', dbError);
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
      });
    });
  });

  //                                   Tests pour la fonction getCurrentUser

  describe('getCurrentUser', () => {
    describe('Succès', () => {
      it('retourne le profil de l\'utilisateur actuel', async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        mockReq.user = { id: 1, role: 'user' };
        const currentUser = createMockUser({ id: 1 });
        User.findByPk = vi.fn().mockResolvedValue(currentUser);

        await getCurrentUser(mockReq, mockRes);

        expect(User.findByPk).toHaveBeenCalledWith(1, {
          attributes: ['id', 'name', 'role', 'createdAt']
        });
        expect(mockJson).toHaveBeenCalledWith(currentUser);
      });
    });

    describe('Utilisateur non trouvé', () => {
      it('retourne 404 si l\'utilisateur actuel n\'existe plus', async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.user = { id: 999, role: 'user' };
        User.findByPk = vi.fn().mockResolvedValue(null);

        await getCurrentUser(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: "User not found" });
      });
    });

    describe('Erreurs de base de données', () => {
      const errors = createDatabaseErrors();

      ['connection', 'sql', 'timeout'].forEach(errorType => {
        it(`gère l'erreur ${errorType}`, async () => {
          const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
          mockReq.user = { id: 1, role: 'user' };
          User.findByPk = vi.fn().mockRejectedValue(errors[errorType]);

          await getCurrentUser(mockReq, mockRes);

          expect(logger.error).toHaveBeenCalledWith('Get current user error:', errors[errorType]);
          expect(mockStatus).toHaveBeenCalledWith(500);
          expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
        });
      });
    });
  });
});