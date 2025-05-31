// test/auth.routes.test.js

import request from 'supertest'; // Sert à envoyer des requêtes HTTP à Express
import { describe, it, expect } from 'vitest'; // Vitest pour structure de test
import app from '../app.js'; // Ton app Express qui utilise le routeur auth

//suite de tests
describe('Tests des routes Auth', () => {
  // 🔐 Test de la route POST /auth/register
  it('POST /auth/register - doit enregistrer un utilisateur', async () => {
    // On envoie une requête POST avec un corps JSON
    const res = await request(app)
      .post('/auth/register') // route ciblée
      .send({ username: 'alice', password: 'secret' }); // données d'entrée

    // On vérifie que le code HTTP est bien 201 (création)
    expect(res.statusCode).toBe(201);

    // On vérifie le contenu de la réponse (dépend de ton contrôleur)
    expect(res.body).toEqual({ message: 'Registered' }); // adaptables à ta réponse réelle
  });

  // 🔑 Test de la route POST /auth/login
  it('POST /auth/login - doit renvoyer un token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'secret' });

    expect(res.statusCode).toBe(200);

    // Vérifie que la réponse contient un token
    expect(res.body.token).toBeDefined();
  });

  // 🔁 Test de la route POST /auth/refresh
  it('POST /auth/refresh - doit renvoyer un nouveau token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({ token: 'ancien-token' }); // exemple de token expiré ou utilisé

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined(); // Vérifie qu'on reçoit bien un "nouveau" token
  });

  // 🚪 Test de la route POST /auth/logout
  it('POST /auth/logout - doit confirmer la déconnexion', async () => {
    const res = await request(app)
      .post('/auth/logout'); // pas besoin de payload ici dans cet exemple

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Logged out'); // message que le contrôleur est censé renvoyer
  });
});
