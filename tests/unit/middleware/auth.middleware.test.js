import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticate, authorize } from '../../../middleware/auth.middleware.js';
import User from '../../../models/user.model.js';
import logger from '../../../middleware/logger.js';
import jwt from 'jsonwebtoken';

// Mock global des dépendances
vi.mock('../../models/user.model.js');
vi.mock('../../middleware/logger.js');
vi.mock('jsonwebtoken');

// Helper pour créer des mocks de req/res/next
const createMockReqResNext = () => {
  const mockStatus = vi.fn().mockReturnThis();
  const mockJson = vi.fn().mockReturnThis();
  const mockNext = vi.fn();
  
  return {
    mockReq: { 
      headers: {},
      user: null
    },
    mockRes: {
      status: mockStatus,
      json: mockJson
    },
    mockNext,
    mockStatus,
    mockJson
  };
};

// Helper pour créer des utilisateurs de test
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'testuser',
  role: 'user',
  ...overrides
});

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.error = vi.fn();
    
    // Mock des variables d'environnement
    process.env.ACCESS_TOKEN_SECRET = 'access_secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests pour la fonction authenticate

  it('authentifie un utilisateur avec un token valide', async () => {
    const { mockReq, mockRes, mockNext } = createMockReqResNext();
    mockReq.headers['authorization'] = 'Bearer valid.token';
    const mockUser = createMockUser();
    
    jwt.verify = vi.fn().mockReturnValue({ id: 1 });
    User.findByPk = vi.fn().mockResolvedValue(mockUser);

    await authenticate(mockReq, mockRes, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token', process.env.ACCESS_TOKEN_SECRET);
    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(mockReq.user).toBe(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it('retourne 401 si aucun header authorization', async () => {
    const { mockReq, mockRes, mockNext, mockStatus, mockJson } = createMockReqResNext();

    await authenticate(mockReq, mockRes, mockNext);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Access token is required"
    });
  });

  it('retourne 401 si pas de token dans le header', async () => {
    const { mockReq, mockRes, mockNext, mockStatus, mockJson } = createMockReqResNext();
    mockReq.headers['authorization'] = 'Bearer ';

    await authenticate(mockReq, mockRes, mockNext);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Access token is required"
    });
  });

  it('retourne 403 si le token JWT est invalide', async () => {
    const { mockReq, mockRes, mockNext, mockStatus, mockJson } = createMockReqResNext();
    mockReq.headers['authorization'] = 'Bearer invalid.token';
    
    jwt.verify = vi.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticate(mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Invalid or expired token"
    });
  });

  it('retourne 403 si l\'utilisateur n\'existe pas', async () => {
    const { mockReq, mockRes, mockNext, mockStatus, mockJson } = createMockReqResNext();
    mockReq.headers['authorization'] = 'Bearer valid.token';
    
    jwt.verify = vi.fn().mockReturnValue({ id: 999 });
    User.findByPk = vi.fn().mockResolvedValue(null);

    await authenticate(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Invalid token"
    });
  });

  // Tests pour la fonction authorize

  it('autorise un utilisateur avec le bon rôle', () => {
    const { mockReq, mockRes, mockNext } = createMockReqResNext();
    mockReq.user = createMockUser({ role: 'admin' });
    
    const authorizeMiddleware = authorize(['admin', 'user']);
    authorizeMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('refuse l\'accès avec un tableau de rôles vide', () => {
    const { mockReq, mockRes, mockNext, mockStatus, mockJson } = createMockReqResNext();
    mockReq.user = createMockUser({ role: 'user' });
    
    const authorizeMiddleware = authorize([]);
    authorizeMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Unauthorized"
    });
  });

  it('retourne 403 si le rôle n\'est pas autorisé', () => {
    const { mockReq, mockRes, mockNext, mockStatus, mockJson } = createMockReqResNext();
    mockReq.user = createMockUser({ role: 'user' });
    
    const authorizeMiddleware = authorize(['admin']);
    authorizeMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({
      error: "Unauthorized"
    });
  });
});