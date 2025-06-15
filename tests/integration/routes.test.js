import { config } from 'dotenv';
config({ path: '.env.test' });

import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { app, initializeApp } from '../../app.js'; // Updated import
import sequelize, { connectDB } from '../../config/db.js';
import User from '../../models/user.model.js';
import Vehicle from '../../models/vehicle.model.js';

const request = supertest(app);

describe('Integration Tests for API Routes', () => {
  let adminToken, userToken, adminUser, regularUser;

  beforeAll(async () => {
    // Initialize test database
    process.env.NODE_ENV = 'test';
    await initializeApp();
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Reset database before each test
    await User.destroy({ truncate: true, cascade: true });
    await Vehicle.destroy({ truncate: true, cascade: true });

    // Create test users
    adminUser = await User.create({
      name: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    regularUser = await User.create({
      name: 'user',
      password: 'user123',
      role: 'user'
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '60m' }
    );

    userToken = jwt.sign(
      { id: regularUser.id, role: regularUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '60m' }
    );
  });

  describe('Auth Routes', () => {
    it('POST /auth/register - should register a new user', async () => {
      const response = await request
        .post('/auth/register')
        .send({ name: 'newuser', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        name: 'newuser',
        role: 'user'
      });
    });

    it('POST /auth/register - should fail if username exists', async () => {
      await request
        .post('/auth/register')
        .send({ name: 'admin', password: 'password123' });

      const response = await request
        .post('/auth/register')
        .send({ name: 'admin', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Username already exists');
    });

    it('POST /auth/login - should login successfully', async () => {
      const response = await request
        .post('/auth/login')
        .send({ name: 'admin', password: 'admin123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        name: 'admin',
        role: 'admin'
      });
    });

    it('POST /auth/login - should fail with invalid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({ name: 'admin', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('POST /auth/refresh - should refresh token', async () => {
      const refreshToken = jwt.sign(
        { id: adminUser.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      await User.update(
        { refreshToken },
        { where: { id: adminUser.id } }
      );

      const response = await request
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('POST /auth/logout - should logout successfully', async () => {
      const refreshToken = jwt.sign(
        { id: adminUser.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      await User.update(
        { refreshToken },
        { where: { id: adminUser.id } }
      );

      const response = await request
        .post('/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(204);

      const updatedUser = await User.findByPk(adminUser.id);
      expect(updatedUser.refreshToken).toBeNull();
    });
  });

  describe('User Routes', () => {
    it('POST /users - admin should create a user', async () => {
      const response = await request
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'newuser', password: 'password123', role: 'user' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: 'newuser',
        role: 'user'
      });
    });

    it('POST /users - non-admin should be unauthorized', async () => {
      const response = await request
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'newuser', password: 'password123', role: 'user' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('GET /users - admin should get all users', async () => {
      const response = await request
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2); // admin and regular user
    });

    it('GET /users/:id - user should get own profile', async () => {
      const response = await request
        .get(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'user',
        role: 'user'
      });
    });

    it('PUT /users/:id - user should update own profile', async () => {
      const response = await request
        .put(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'updateduser', password: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('updateduser');
    });

    it('DELETE /users/:id - admin should delete a user', async () => {
      const response = await request
        .delete(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('has been successfully deleted');
    });
  });

  describe('Vehicle Routes', () => {
    it('POST /vehicles - should create a vehicle', async () => {
      const response = await request
        .post('/vehicles')
        .send({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'ABC123',
          annees: 2020,
          prixLocation: 2000
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123'
      });
    });

    it('GET /vehicles - should get all vehicles', async () => {
      await Vehicle.create({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123',
        annees: 2020,
        prixLocation: 2000
      });

      const response = await request.get('/vehicles');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toMatchObject({ immatriculation: 'ABC123' });
    });

    it('GET /vehicles/:id - should get a vehicle by ID', async () => {
      const vehicle = await Vehicle.create({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123',
        annees: 2020,
        prixLocation: 2000
      });

      const response = await request.get(`/vehicles/${vehicle.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ immatriculation: 'ABC123' });
    });

    it('PUT /vehicles/:id - should update a vehicle', async () => {
      const vehicle = await Vehicle.create({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123',
        annees: 2020,
        prixLocation: 2000
      });

      const response = await request
        .put(`/vehicles/${vehicle.id}`)
        .send({ marque: 'Honda', prixLocation: 2500 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        marque: 'Honda',
        prixLocation: 2500
      });
    });

    it('DELETE /vehicles/:id - should delete a vehicle', async () => {
      const vehicle = await Vehicle.create({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123',
        annees: 2020,
        prixLocation: 2000
      });

      const response = await request.delete(`/vehicles/${vehicle.id}`);

      expect(response.status).toBe(204);
    });

    it('GET /vehicles/search/:immatriculation - should find vehicle by immatriculation', async () => {
      await Vehicle.create({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123',
        annees: 2020,
        prixLocation: 2000
      });

      const response = await request.get('/vehicles/search/ABC123');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ immatriculation: 'ABC123' });
    });

    it('GET /vehicles/price/:priceMax - should filter vehicles by price', async () => {
      await Vehicle.create({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC123',
        annees: 2020,
        prixLocation: 1500
      });
      await Vehicle.create({
        marque: 'Honda',
        model: 'Civic',
        immatriculation: 'XYZ789',
        annees: 2021,
        prixLocation: 3000
      });

      const response = await request.get('/vehicles/price/2000');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toMatchObject({ immatriculation: 'ABC123' });
    });
  });
});
