import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  register,
  login,
  refreshToken,
  logout
} from '../../../controllers/auth.controller.js';
import User from '../../../models/user.model.js';
import logger from '../../../middleware/logger.js';
import jwt from 'jsonwebtoken';

// Mock global des dépendances
vi.mock('../models/user.model.js');
vi.mock('../middleware/logger.js');
vi.mock('jsonwebtoken');

// Helper pour créer des mocks de req/res
const createMockReqRes = () => {
  const mockStatus = vi.fn().mockReturnThis();
  const mockJson = vi.fn().mockReturnThis();
  const mockSend = vi.fn().mockReturnThis();
  
  return {
    mockReq: { 
      body: {}
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
  password: '$2b$10$hashedpassword',
  refreshToken: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  comparePassword: vi.fn(),
  ...overrides
});

// Helper pour créer des tokens de test
const createMockTokens = () => ({
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token'
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

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.info = vi.fn();
    logger.error = vi.fn();
    
    // Mock des variables d'environnement
    process.env.ACCESS_TOKEN_SECRET = 'access_secret';
    process.env.REFRESH_TOKEN_SECRET = 'refresh_secret';
    process.env.NODE_ENV = 'test';
    
    // Mock des fonctions JWT
    jwt.sign = vi.fn()
      .mockReturnValueOnce('mock.access.token')
      .mockReturnValueOnce('mock.refresh.token');
    jwt.verify = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests pour la fonction register

  it('register - enregistre un nouvel utilisateur avec tous les champs', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    const userData = {
      name: 'newuser',
      password: 'password123'
    };
    mockReq.body = userData;
    const createdUser = createMockUser(userData);
    
    User.findOne = vi.fn().mockResolvedValue(null);
    User.create = vi.fn().mockResolvedValue(createdUser);
    User.update = vi.fn().mockResolvedValue();

    await register(mockReq, mockRes);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'newuser' } });
    expect(User.create).toHaveBeenCalledWith({
      name: 'newuser',
      password: 'password123',
      role: 'user'
    });
    expect(jwt.sign).toHaveBeenCalledTimes(2);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: createdUser.id, role: createdUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '60m' }
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: createdUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    expect(User.update).toHaveBeenCalledWith(
      { refreshToken: 'mock.refresh.token' },
      { where: { id: createdUser.id } }
    );
    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith({
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
      user: {
        id: createdUser.id,
        name: createdUser.name,
        role: createdUser.role
      }
    });
    expect(logger.info).toHaveBeenCalledWith(`User registered: ${userData.name}`);
  });

  it('register - retourne 400 si le nom est manquant', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { password: 'password123' };

    await register(mockReq, mockRes);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Username and password are required"
    });
  });

  it('register - retourne 400 si le mot de passe est manquant', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser' };

    await register(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Username and password are required"
    });
  });

  it('register - retourne 409 si l\'utilisateur existe déjà', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'existinguser', password: 'password123' };
    
    User.findOne = vi.fn().mockResolvedValue(createMockUser({ name: 'existinguser' }));

    await register(mockReq, mockRes);

    expect(User.create).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({ error: "Username already exists" });
  });

  it('register - retourne 500 pour erreur de connexion base de données', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockResolvedValue(null);
    User.create = vi.fn().mockRejectedValue(errors.connection);

    await register(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Registration error:', errors.connection);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Registration failed"
    });
  });

  it('register - retourne 500 pour erreur de timeout base de données', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockResolvedValue(null);
    User.create = vi.fn().mockRejectedValue(errors.timeout);

    await register(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Registration error:', errors.timeout);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Registration failed"
    });
  });

  it('register - retourne 500 pour erreur SQL', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockResolvedValue(null);
    User.create = vi.fn().mockRejectedValue(errors.sql);

    await register(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Registration error:', errors.sql);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Registration failed"
    });
  });

  it('register - retourne 500 pour erreur de validation', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockResolvedValue(null);
    User.create = vi.fn().mockRejectedValue(errors.validation);

    await register(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Registration error:', errors.validation);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Registration failed"
    });
  });

  it('register - inclut les détails d\'erreur en développement', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    process.env.NODE_ENV = 'development';
    const testError = new Error('Test error message');
    
    User.findOne = vi.fn().mockResolvedValue(null);
    User.create = vi.fn().mockRejectedValue(testError);

    await register(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Registration failed",
      details: 'Test error message'
    });
  });

  // Tests pour la fonction login

  it('login - connecte un utilisateur avec des identifiants valides', async () => {
    const { mockReq, mockRes, mockJson } = createMockReqRes();
    const userData = {
      name: 'testuser',
      password: 'password123'
    };
    mockReq.body = userData;
    const mockUser = createMockUser();
    mockUser.comparePassword.mockResolvedValue(true);
    
    User.findOne = vi.fn().mockResolvedValue(mockUser);
    User.update = vi.fn().mockResolvedValue();

    await login(mockReq, mockRes);

    expect(User.findOne).toHaveBeenCalledWith({ where: { name: 'testuser' } });
    expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
    expect(User.update).toHaveBeenCalledWith(
      { refreshToken: 'mock.refresh.token' },
      { where: { id: mockUser.id } }
    );
    expect(mockJson).toHaveBeenCalledWith({
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
      user: {
        id: mockUser.id,
        name: mockUser.name,
        role: mockUser.role
      }
    });
    expect(logger.info).toHaveBeenCalledWith(`User logged in: ${userData.name}`);
  });

  it('login - retourne 400 si le nom est manquant', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { password: 'password123' };

    await login(mockReq, mockRes);

    expect(User.findOne).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Username and password are required"
    });
  });

  it('login - retourne 400 si le mot de passe est manquant', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser' };

    await login(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Username and password are required"
    });
  });

  it('login - retourne 401 si l\'utilisateur n\'existe pas', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'nonexistent', password: 'password123' };
    
    User.findOne = vi.fn().mockResolvedValue(null);

    await login(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  it('login - retourne 401 si le mot de passe est incorrect', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'wrongpassword' };
    const mockUser = createMockUser();
    mockUser.comparePassword.mockResolvedValue(false);
    
    User.findOne = vi.fn().mockResolvedValue(mockUser);

    await login(mockReq, mockRes);

    expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  it('login - retourne 500 pour erreur de connexion base de données', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockRejectedValue(errors.connection);

    await login(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Login error:', errors.connection);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Login failed"
    });
  });

  it('login - retourne 500 pour erreur de timeout base de données', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockRejectedValue(errors.timeout);

    await login(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Login error:', errors.timeout);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Login failed"
    });
  });

  it('login - retourne 500 pour erreur SQL', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { name: 'testuser', password: 'password123' };
    const errors = createDatabaseErrors();
    
    User.findOne = vi.fn().mockRejectedValue(errors.sql);

    await login(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Login error:', errors.sql);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ 
      error: "Login failed"
    });
  });

  // Tests pour la fonction refreshToken

  it('refreshToken - génère de nouveaux tokens avec un refresh token valide', async () => {
    const { mockReq, mockRes, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'valid.refresh.token' };
    const mockUser = createMockUser({ refreshToken: 'valid.refresh.token' });
    
    jwt.verify = vi.fn().mockReturnValue({ id: mockUser.id });
    User.findByPk = vi.fn().mockResolvedValue(mockUser);
    User.update = vi.fn().mockResolvedValue();

    await refreshToken(mockReq, mockRes);

    expect(jwt.verify).toHaveBeenCalledWith('valid.refresh.token', process.env.REFRESH_TOKEN_SECRET);
    expect(User.findByPk).toHaveBeenCalledWith(mockUser.id);
    expect(User.update).toHaveBeenCalledWith(
      { refreshToken: 'mock.refresh.token' },
      { where: { id: mockUser.id } }
    );
    expect(mockJson).toHaveBeenCalledWith({
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token'
    });
  });

  it('refreshToken - retourne 401 si le refresh token est manquant', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = {};

    await refreshToken(mockReq, mockRes);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Refresh token is required"
    });
  });

  it('refreshToken - retourne 403 si le token JWT est invalide', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'invalid.token' };
    
    jwt.verify = vi.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await refreshToken(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Refresh token error:', expect.any(Error));
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it('refreshToken - retourne 403 si l\'utilisateur n\'existe pas', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'valid.refresh.token' };
    
    jwt.verify = vi.fn().mockReturnValue({ id: 999 });
    User.findByPk = vi.fn().mockResolvedValue(null);

    await refreshToken(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid refresh token" });
  });

  it('refreshToken - retourne 403 si le refresh token ne correspond pas', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'different.token' };
    const mockUser = createMockUser({ refreshToken: 'stored.token' });
    
    jwt.verify = vi.fn().mockReturnValue({ id: mockUser.id });
    User.findByPk = vi.fn().mockResolvedValue(mockUser);

    await refreshToken(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid refresh token" });
  });

  // Tests pour la fonction logout

  it('logout - déconnecte l\'utilisateur en supprimant le refresh token', async () => {
    const { mockReq, mockRes, mockStatus, mockSend } = createMockReqRes();
    mockReq.body = { refreshToken: 'valid.refresh.token' };
    
    jwt.verify = vi.fn().mockReturnValue({ id: 1 });
    User.update = vi.fn().mockResolvedValue();

    await logout(mockReq, mockRes);

    expect(jwt.verify).toHaveBeenCalledWith('valid.refresh.token', process.env.REFRESH_TOKEN_SECRET);
    expect(User.update).toHaveBeenCalledWith(
      { refreshToken: null },
      { where: { id: 1 } }
    );
    expect(mockStatus).toHaveBeenCalledWith(204);
    expect(mockSend).toHaveBeenCalled();
  });

  it('logout - retourne 400 si le refresh token est manquant', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = {};

    await logout(mockReq, mockRes);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Refresh token is required"
    });
  });

  it('logout - retourne 500 si le token JWT est invalide', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'invalid.token' };
    
    jwt.verify = vi.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await logout(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it('logout - gère l\'erreur de connexion base de données', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'valid.token' };
    const errors = createDatabaseErrors();
    
    jwt.verify = vi.fn().mockReturnValue({ id: 1 });
    User.update = vi.fn().mockRejectedValue(errors.connection);

    await logout(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Logout error:', errors.connection);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it('logout - gère l\'erreur de timeout base de données', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'valid.token' };
    const errors = createDatabaseErrors();
    
    jwt.verify = vi.fn().mockReturnValue({ id: 1 });
    User.update = vi.fn().mockRejectedValue(errors.timeout);

    await logout(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Logout error:', errors.timeout);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it('logout - gère l\'erreur SQL', async () => {
    const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
    mockReq.body = { refreshToken: 'valid.token' };
    const errors = createDatabaseErrors();
    
    jwt.verify = vi.fn().mockReturnValue({ id: 1 });
    User.update = vi.fn().mockRejectedValue(errors.sql);

    await logout(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Logout error:', errors.sql);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});