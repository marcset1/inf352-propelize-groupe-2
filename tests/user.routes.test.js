
import request from 'supertest';
import { describe, it,vi, expect, beforeEach } from 'vitest';
import { app } from '../app.js';
import { randomUUID } from 'crypto';
import { seedAll } from '../data/seedData.js';
import User from '../models/user.model.js';



import sequelize from '../config/db.js';

await seedAll()
// ⚠️ MOCK AVANT IMPORTATION DE APP
vi.mock('../middleware/auth.middleware.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: '1', role: 'admin' }; // Simule un utilisateur connecté
    next();
  },
  authorize: (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  }
}));



const headers = { Authorization: 'Bearer faketoken123' };
let createdUserId = null;



describe('Tests des routes Utilisateur', () => {
  beforeEach(async () => {
    // Réinitialise la base à chaque test (optionnel)
    await sequelize.sync({ force: true });

    // Crée un utilisateur initial pour les tests GET/PUT/DELETE
    const user = await User.create({
      name: 'bob',
      password: '1234',
      role: 'user',
    });
    createdUserId = user.id;
  });

  // 👤 Création d’un utilisateur (admin requis)
  it('POST /users - crée un nouvel utilisateur (admin)', async () => {
    const res = await request(app)
      .post('/users')
      .set(headers)
      .send({ name: 'alice', password: 'abcd', role: 'user' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      name: 'alice',
      role: 'user'
    });
  });

  // 📋 Liste des utilisateurs
  it('GET /users - retourne la liste des utilisateurs', async () => {
    const res = await request(app).get('/users').set(headers);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // 🔍 Un utilisateur par ID
  it('GET /users/:id - retourne un utilisateur', async () => {
    const res = await request(app).get(`/users/${createdUserId}`).set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdUserId);
    expect(res.body).toHaveProperty('name', 'bob');
  });

  // ✏️ Mise à jour d’un utilisateur
  it('PUT /users/:id - modifie un utilisateur', async () => {
    const res = await request(app)
      .put(`/users/${createdUserId}`)
      .set(headers)
      .send({ name: 'bob_updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'bob_updated');
  });

  // 🗑 Suppression d’un utilisateur
  it('DELETE /users/:id - supprime un utilisateur', async () => {
    const res = await request(app)
      .delete(`/users/${createdUserId}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'bob has been successfully deleted');
  });
});



// let app;

// let existingUserId = null;
// let adminId = null;
// await seedAll();

// describe('Tests des erreurs pour les routes utilisateur', () => {
//   beforeEach(async () => {
//     await sequelize.sync({ force: true });

//     const existingUser = await User.create({
//       name: 'bob',
//       password: '1234',
//       role: 'user'
//     });
//     existingUserId = existingUser.id;

//     adminId = randomUUID();

//     await User.create({
//       id: adminId,
//       name: 'admin',
//       password: 'adminpass',
//       role: 'admin'
//     });

//     // Mock dynamique du middleware
//     vi.doMock('../middleware/auth.middleware.js', () => ({
//       authenticate: (req, res, next) => {
//         req.user = { id: adminId, role: 'admin' };
//         next();
//       },
//       authorize: (roles) => (req, res, next) => {
//         if (!roles.includes('admin')) {
//           return res.status(403).json({ message: 'Access denied' });
//         }
//         next();
//       }
//     }));

//     // Importer l'app APRÈS le mock
//     app = (await import('../app.js')).app;
//   });

//   describe('POST /users', () => {
//     it('échoue sans nom ou mot de passe', async () => {
//       const res = await request(app)
//         .post('/users')
//         .set(headers)
//         .send({ role: 'user' });

//       expect(res.statusCode).toBe(400);
//       expect(res.body.error).toBe("Name and password are required");
//     });

//     it('échoue si nom déjà utilisé', async () => {
//       const res = await request(app)
//         .post('/users')
//         .set(headers)
//         .send({ name: 'bob', password: 'abcd', role: 'user' });

//       expect(res.statusCode).toBe(409);
//       expect(res.body.error).toBe("Username already in use");
//     });
//   });

//   describe('GET /users/:id', () => {
//     it('échoue si utilisateur inexistant', async () => {
//       const fakeId = randomUUID();
//       const res = await request(app)
//         .get(`/users/${fakeId}`)
//         .set(headers);

//       expect(res.statusCode).toBe(404);
//       expect(res.body.error).toBe("User not found");
//     });
//   });

//   describe('PUT /users/:id', () => {
//     it('échoue si utilisateur inexistant', async () => {
//       const fakeId = randomUUID();
//       const res = await request(app)
//         .put(`/users/${fakeId}`)
//         .set(headers)
//         .send({ name: 'nouveauNom' });

//       expect(res.statusCode).toBe(404);
//       expect(res.body.error).toBe("User not found");
//     });

//     it('échoue sans données à mettre à jour', async () => {
//       const res = await request(app)
//         .put(`/users/${existingUserId}`)
//         .set(headers)
//         .send({});

//       expect(res.statusCode).toBe(400);
//       expect(res.body.error).toBe("No valid fields to update");
//     });

//     it("échoue si admin veut changer son propre rôle", async () => {
//       const res = await request(app)
//         .put(`/users/${adminId}`)
//         .set(headers)
//         .send({ role: 'user' });

//       expect(res.statusCode).toBe(403);
//       expect(res.body.error).toBe("Cannot change your own role");
//     });
//   });

//   describe('DELETE /users/:id', () => {
//     it('échoue si on essaie de se supprimer soi-même', async () => {
//       const res = await request(app)
//         .delete(`/users/${adminId}`)
//         .set(headers);

//       expect(res.statusCode).toBe(403);
//       expect(res.body.error).toBe("Cannot delete your own account");
//     });
//   });
// });
