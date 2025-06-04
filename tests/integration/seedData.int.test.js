// Fichier : tests/unit/seedData.test.js
import { generateVehicleData, generateUserData, seedVehicles, seedUsers, seedAll } from '../../data/seedData.js';
import { describe, test, expect, beforeEach } from 'vitest';
import Vehicle from '../../models/vehicle.model.js';
import User from '../../models/user.model.js';

describe('Seeders - Intégration avec la base de données', () => {
  beforeEach(async () => {
    await Vehicle.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  test('TC005 - seedVehicles insère 10 véhicules si table vide', async () => {
    await seedVehicles();
    const count = await Vehicle.count();
    expect(count).toBe(10);
  });

  test('TC006 - seedVehicles ne réinsère pas si la table contient déjà des données', async () => {
    await Vehicle.create({
      marque: 'Test', model: 'TestModel', immatriculation: 'T123', annees: 2024, prixLocation: 1600
    });
    await seedVehicles();
    const count = await Vehicle.count();
    expect(count).toBe(1); // Aucun ajout supplémentaire
  });

  test('TC007 - seedUsers insère 5 utilisateurs si table vide', async () => {
    await seedUsers();
    const count = await User.count();
    expect(count).toBe(5);
  });

  test('TC008 - seedUsers ne réinsère pas si la table contient déjà des utilisateurs', async () => {
    await User.create({ name: 'admin', password: '1234', role: 'admin' });
    await seedUsers();
    const count = await User.count();
    expect(count).toBe(1);
  });

  test('TC009 - seedAll insère à la fois utilisateurs et véhicules si tables vides', async () => {
    await seedAll();
    const userCount = await User.count();
    const vehicleCount = await Vehicle.count();

    expect(userCount).toBe(5);
    expect(vehicleCount).toBe(10);
  });
});
