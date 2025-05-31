import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('../data/seedData.js', () => ({
  seedAll: vi.fn().mockResolvedValue(undefined), // <-- manquait !
}));

import { app } from '../app.js';
import sequelize from '../config/db.js';
import User from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';

let adminId;
let existingUserId;

// Mock du middleware d'authentification
vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: adminId, role: 'admin' };
    next();
  },
  authorize: (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  },
}));

const headers = { Authorization: 'Bearer faketoken123' };

describe('Tests des erreurs pour les routes utilisateur', () => {
  beforeEach(async () => {
    // Réinitialise complètement la base avant chaque test
    await sequelize.sync({ force: true });

    // Création d’un administrateur simulé
    const adminUser = await User.create({
      name: 'admin',
      password: 'adminpass',
      role: 'admin',
    });
    adminId = adminUser.id;

    // Création d’un utilisateur simple
    const user = await User.create({
      name: 'bob',
      password: '1234',
      role: 'user',
    });
    existingUserId = user.id;
  });

  describe('POST /users', () => {
    it('échoue sans nom ou mot de passe', async () => {
      const res = await request(app)
        .post('/users')
        .set(headers)
        .send({ role: 'user' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Name and password are required');
    });

    it('échoue si nom déjà utilisé', async () => {
      const res = await request(app)
        .post('/users')
        .set(headers)
        .send({ name: 'bob', password: 'abcd', role: 'user' });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('Username already in use');
    });
  });

  describe('GET /users/:id', () => {
    it('échoue si utilisateur inexistant', async () => {
      const res = await request(app)
        .get(`/users/${uuidv4()}`)
        .set(headers);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('PUT /users/:id', () => {
    it('échoue si utilisateur inexistant', async () => {
      const res = await request(app)
        .put(`/users/${uuidv4()}`)
        .set(headers)
        .send({ name: 'nouveauNom' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('échoue sans données à mettre à jour', async () => {
      const res = await request(app)
        .put(`/users/${existingUserId}`)
        .set(headers)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('No valid fields to update');
    });

    it('échoue si admin veut changer son propre rôle', async () => {
      const res = await request(app)
        .put(`/users/${adminId}`)
        .set(headers)
        .send({ role: 'user' });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Cannot change your own role');
    });
  });

  describe('DELETE /users/:id', () => {
    it('échoue si on essaie de se supprimer soi-même', async () => {
      const res = await request(app)
        .delete(`/users/${adminId}`)
        .set(headers);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Cannot delete your own account');
    });
  });
});
