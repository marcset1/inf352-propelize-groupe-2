// Fichier : tests/unit/seedData.test.js
import { generateVehicleData, generateUserData, seedVehicles, seedUsers, seedAll } from '../../data/seedData.js';
import { describe, test, expect, beforeEach } from 'vitest';
import Vehicle from '../../models/vehicle.model.js';
import User from '../../models/user.model.js';


describe('generateVehicleData', () => {
  test('TC001 - Génère 10 véhicules avec structure correcte', () => {
    const result = generateVehicleData();   

    expect(result).toHaveLength(10);
    result.forEach(vehicle => {
      expect(vehicle).toHaveProperty('marque');
      expect(vehicle).toHaveProperty('model');
      expect(vehicle).toHaveProperty('immatriculation');
      expect(vehicle).toHaveProperty('annees');
      expect(vehicle).toHaveProperty('prixLocation');
    });
    result.forEach(vehicle => {
      expect(typeof vehicle.marque).toBe('string');
      expect(typeof vehicle.model).toBe('string');
      expect(typeof vehicle.immatriculation).toBe('string');
      expect(typeof vehicle.annees).toBe('number');
      expect(typeof vehicle.prixLocation).toBe('number');
    });
  });

  test('TC002 - Vérifie les plages de valeurs des véhicules générés', () => {
    const result = generateVehicleData();
    const marques = ["Toyota", "Mercedes", "Audi", "Ford", "Nissan"];
    const annees = [2022, 2023, 2024, 2025, 2026];

    result.forEach(vehicle => {
      expect(marques).toContain(vehicle.marque);
      expect(annees).toContain(vehicle.annees);
      expect(vehicle.prixLocation).toBeGreaterThanOrEqual(1500);
      expect(vehicle.prixLocation).toBeLessThanOrEqual(1851);
    });
  });
});

describe('generateUserData', () => {
  test('TC003 - Génère 5 utilisateurs avec structure correcte', () => {
    const users = generateUserData();

    

    expect(users).toHaveLength(5);
    users.forEach(user => {
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('role');
      expect(typeof user.name).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(typeof user.role).toBe('string');
    });
  });

  test("TC004 - Vérifie que l'utilisateur 'admin' est présent et que les rôles sont valides", () => {
    const users = generateUserData();
    const roles = ['admin', 'user'];
    const adminUser = users.find(user => user.name === 'admin');

    expect(adminUser).toBeDefined();
    users.forEach(user => {
      expect(roles).toContain(user.role);
    });
  });
});

