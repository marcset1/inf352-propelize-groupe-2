import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchByImmatriculation,
  filterByPrice
} from '../../../controllers/vehicle.controller.js';
import { Op } from 'sequelize';
import Vehicle from '../../../models/vehicle.model.js';
import logger from '../../../middleware/logger.js';

// Mock global des dépendances
vi.mock('../models/vehicle.model.js');
vi.mock('../middleware/logger.js');

// Helper pour créer des mocks de req/res
const createMockReqRes = () => {
  const mockStatus = vi.fn().mockReturnThis();
  const mockJson = vi.fn().mockReturnThis();
  const mockSend = vi.fn().mockReturnThis();
  
  return {
    mockReq: { body: {}, params: {} },
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

// Helper pour créer des véhicules de test
const createMockVehicle = (overrides = {}) => ({
  id: 1,
  marque: 'Toyota',
  model: 'Corolla',
  immatriculation: 'ABC-123',
  annees: 2023,
  prixLocation: 2000,
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
  sql: (() => {
    const err = new Error('Invalid SQL query');
    err.name = 'SequelizeDatabaseError';
    return err;
  })()
});

describe('Vehicle Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.info = vi.fn();
    logger.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests pour la fonction CreateVehicle
  describe('createVehicle', () => {
    it('crée un véhicule avec tous les champs', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      const vehicleData = {
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'ABC-123',
        annees: 2023,
        prixLocation: 2000
      };
      mockReq.body = vehicleData;
      const createdVehicle = createMockVehicle(vehicleData);
      Vehicle.create = vi.fn().mockResolvedValue(createdVehicle);

      await createVehicle(mockReq, mockRes);

      expect(Vehicle.create).toHaveBeenCalledWith(vehicleData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(createdVehicle);
      expect(logger.info).toHaveBeenCalledWith(`Vehicle created: ${vehicleData.immatriculation}`);
    });

    it('applique les valeurs par défaut pour annees et prixLocation', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      const currentYear = new Date().getFullYear();
      mockReq.body = {
        marque: 'Honda',
        model: 'Civic',
        immatriculation: 'XYZ-789'
      };
      const expectedData = { ...mockReq.body, annees: currentYear, prixLocation: 1500 };
      Vehicle.create = vi.fn().mockResolvedValue(createMockVehicle(expectedData));

      await createVehicle(mockReq, mockRes);

      expect(Vehicle.create).toHaveBeenCalledWith(expectedData);
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    // Tests de validation des champs requis
    const requiredFields = ['marque', 'model', 'immatriculation'];
    const validData = { marque: 'Toyota', model: 'Corolla', immatriculation: 'ABC-123' };

    requiredFields.forEach(field => {
      it(`retourne 400 si ${field} est manquant`, async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        const invalidData = { ...validData };
        delete invalidData[field];
        mockReq.body = invalidData;

        await createVehicle(mockReq, mockRes);

        expect(Vehicle.create).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          error: "Missing required fields: marque, model, and immatriculation are required"
        });
      });
    });

    it('retourne 409 pour contrainte d\'unicité', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.body = { marque: 'Toyota', model: 'Corolla', immatriculation: 'ABC-123' };
      const errors = createDatabaseErrors();
      Vehicle.create = vi.fn().mockRejectedValue(errors.unique);

      await createVehicle(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Create vehicle error:', errors.unique);
      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Vehicle with this immatriculation already exists"
      });
    });

    // Tests d'erreurs de base de données
    ['connection', 'timeout', 'sql'].forEach(errorType => {
      it(`retourne 500 pour erreur ${errorType}`, async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.body = { marque: 'Toyota', model: 'Corolla', immatriculation: 'ABC-123' };
        const errors = createDatabaseErrors();
        Vehicle.create = vi.fn().mockRejectedValue(errors[errorType]);

        await createVehicle(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith('Create vehicle error:', errors[errorType]);
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
      });
    });
  });

  // Tests pour la fonction getAllVehicles
  describe('getAllVehicles', () => {
    it('retourne tous les véhicules', async () => {
      const { mockReq, mockRes, mockJson } = createMockReqRes();
      const mockVehicles = [
        createMockVehicle({ id: 1, immatriculation: 'ABC-123' }),
        createMockVehicle({ id: 2, immatriculation: 'XYZ-789', marque: 'Honda', model: 'Civic' })
      ];
      Vehicle.findAll = vi.fn().mockResolvedValue(mockVehicles);

      await getAllVehicles(mockReq, mockRes);

      expect(Vehicle.findAll).toHaveBeenCalledWith();
      expect(mockJson).toHaveBeenCalledWith(mockVehicles);
    });

    it('retourne 404 quand aucun véhicule trouvé', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      Vehicle.findAll = vi.fn().mockResolvedValue([]);

      await getAllVehicles(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "No vehicles found" });
    });

    // Tests d'erreurs de base de données
    ['connection', 'timeout', 'sql'].forEach(errorType => {
      it(`gère l'erreur ${errorType}`, async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        const errors = createDatabaseErrors();
        Vehicle.findAll = vi.fn().mockRejectedValue(errors[errorType]);

        await getAllVehicles(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith('Get vehicles error:', errors[errorType]);
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
      });
    });
  });

  // Tests pour la fonction getVehicleById
  describe('getVehicleById', () => {
    it('retourne un véhicule existant', async () => {
      const { mockReq, mockRes, mockJson } = createMockReqRes();
      mockReq.params.id = '1';
      const mockVehicle = createMockVehicle();
      Vehicle.findByPk = vi.fn().mockResolvedValue(mockVehicle);

      await getVehicleById(mockReq, mockRes);

      expect(Vehicle.findByPk).toHaveBeenCalledWith('1');
      expect(mockJson).toHaveBeenCalledWith(mockVehicle);
    });

    ['42', '007', '999999999'].forEach(id => {
      it(`fonctionne avec l'ID ${id}`, async () => {
        const { mockReq, mockRes, mockJson } = createMockReqRes();
        mockReq.params.id = id;
        const mockVehicle = createMockVehicle({ id: parseInt(id) || 7 });
        Vehicle.findByPk = vi.fn().mockResolvedValue(mockVehicle);

        await getVehicleById(mockReq, mockRes);

        expect(Vehicle.findByPk).toHaveBeenCalledWith(id);
        expect(mockJson).toHaveBeenCalledWith(mockVehicle);
      });
    });

    ['999', '0', undefined].forEach(id => {
      it(`retourne 404 pour l'ID ${id}`, async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = id;
        Vehicle.findByPk = vi.fn().mockResolvedValue(null);

        await getVehicleById(mockReq, mockRes);

        expect(mockStatus).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: "Vehicle not found" });
      });
    });

    // Tests d'erreurs de base de données
    ['connection', 'sql', 'timeout'].forEach(errorType => {
      it(`gère l'erreur ${errorType}`, async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.id = '1';
        const errors = createDatabaseErrors();
        Vehicle.findByPk = vi.fn().mockRejectedValue(errors[errorType]);

        await getVehicleById(mockReq, mockRes);

        expect(logger.error).toHaveBeenCalledWith('Get vehicle error:', errors[errorType]);
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
      });
    });
  });

  // Tests pour la fonction updateVehicle
  describe('updateVehicle', () => {
    it('met à jour un véhicule existant', async () => {
      const { mockReq, mockRes, mockJson } = createMockReqRes();
      mockReq.params.id = '1';
      mockReq.body = { marque: 'Toyota Updated' };
      const updatedVehicle = createMockVehicle({ marque: 'Toyota Updated' });

      Vehicle.update = vi.fn().mockResolvedValue([1]);
      Vehicle.findByPk = vi.fn().mockResolvedValue(updatedVehicle);

      await updateVehicle(mockReq, mockRes);

      expect(Vehicle.update).toHaveBeenCalledWith(mockReq.body, { where: { id: '1' } });
      expect(Vehicle.findByPk).toHaveBeenCalledWith('1');
      expect(mockJson).toHaveBeenCalledWith(updatedVehicle);
      expect(logger.info).toHaveBeenCalledWith('Updated vehicle: 1');
    });

    it('retourne 404 pour véhicule inexistant', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.id = '999';
      mockReq.body = { marque: 'Test' };
      Vehicle.update = vi.fn().mockResolvedValue([0]);

      await updateVehicle(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    it('gère les erreurs de mise à jour', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.id = '1';
      mockReq.body = { marque: 'Test' };
      const dbError = new Error('Update failed');
      Vehicle.update = vi.fn().mockRejectedValue(dbError);

      await updateVehicle(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Update vehicle error:', dbError);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // Tests pour la fonction deleteVehicle
  describe('deleteVehicle', () => {
    it('supprime un véhicule existant', async () => {
      const { mockReq, mockRes, mockStatus, mockSend } = createMockReqRes();
      mockReq.params.id = '1';
      Vehicle.destroy = vi.fn().mockResolvedValue(1);

      await deleteVehicle(mockReq, mockRes);

      expect(Vehicle.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Deleted vehicle: 1');
    });

    it('retourne 404 pour véhicule inexistant', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.id = '999';
      Vehicle.destroy = vi.fn().mockResolvedValue(0);

      await deleteVehicle(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    it('gère les erreurs de suppression', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.id = '1';
      const dbError = new Error('Delete failed');
      Vehicle.destroy = vi.fn().mockRejectedValue(dbError);

      await deleteVehicle(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Delete vehicle error:', dbError);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // Tests pour la fonction searchByImmatriculation
  describe('searchByImmatriculation', () => {
    it('trouve un véhicule par immatriculation', async () => {
      const { mockReq, mockRes, mockJson } = createMockReqRes();
      mockReq.params.immatriculation = 'ABC-123';
      const mockVehicle = createMockVehicle();
      Vehicle.findOne = vi.fn().mockResolvedValue(mockVehicle);

      await searchByImmatriculation(mockReq, mockRes);

      expect(Vehicle.findOne).toHaveBeenCalledWith({
        where: { immatriculation: { [Op.iLike]: 'ABC-123' } }
      });
      expect(mockJson).toHaveBeenCalledWith(mockVehicle);
    });

    it('retourne 404 pour immatriculation inexistante', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.immatriculation = 'NOTFOUND-123';
      Vehicle.findOne = vi.fn().mockResolvedValue(null);

      await searchByImmatriculation(mockReq, mockRes);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    it('gère les erreurs de recherche', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.immatriculation = 'ABC-123';
      const dbError = new Error('Search failed');
      Vehicle.findOne = vi.fn().mockRejectedValue(dbError);

      await searchByImmatriculation(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Search vehicle error:', dbError);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // Tests pour la fonction filterByPrice
  describe('filterByPrice', () => {
    it('filtre les véhicules par prix maximum', async () => {
      const { mockReq, mockRes, mockJson } = createMockReqRes();
      mockReq.params.priceMax = '2000';
      const mockVehicles = [
        createMockVehicle({ prixLocation: 1500 }),
        createMockVehicle({ id: 2, prixLocation: 2000 })
      ];
      Vehicle.findAll = vi.fn().mockResolvedValue(mockVehicles);

      await filterByPrice(mockReq, mockRes);

      expect(Vehicle.findAll).toHaveBeenCalledWith({
        where: { prixLocation: { [Op.lte]: 2000 } },
        order: [['prixLocation', 'ASC']]
      });
      expect(mockJson).toHaveBeenCalledWith(mockVehicles);
    });

    it('retourne une liste vide si aucun véhicule dans la gamme de prix', async () => {
      const { mockReq, mockRes, mockJson } = createMockReqRes();
      mockReq.params.priceMax = '100';
      Vehicle.findAll = vi.fn().mockResolvedValue([]);

      await filterByPrice(mockReq, mockRes);

      expect(mockJson).toHaveBeenCalledWith([]);
    });

    // Tests de validation des prix invalides
    ['invalid', 'NaN', '', null, undefined].forEach(invalidPrice => {
      it(`retourne 400 pour prix invalide: ${invalidPrice}`, async () => {
        const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
        mockReq.params.priceMax = invalidPrice;

        await filterByPrice(mockReq, mockRes);

        expect(Vehicle.findAll).not.toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: "Invalid price parameter" });
      });
    });

    it('gère les erreurs de filtrage', async () => {
      const { mockReq, mockRes, mockStatus, mockJson } = createMockReqRes();
      mockReq.params.priceMax = '2000';
      const dbError = new Error('Filter failed');
      Vehicle.findAll = vi.fn().mockRejectedValue(dbError);

      await filterByPrice(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Filter vehicles error:', dbError);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });
});