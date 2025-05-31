// vehicle.controllers.test.js
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchByImmatriculation,
  filterByPrice
} from './vehicle.controller.js';
import Vehicle from '../models/vehicle.model.js';
import { Op } from 'sequelize';
import logger from '../middleware/logger.js';

// Mock des dépendances
vi.mock('../models/vehicle.model.js');
vi.mock('../middleware/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

describe('Vehicle Controller', () => {
  const mockRequest = (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query
  });

  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVehicle', () => {
    test('should create a new vehicle with valid data', async () => {
      const req = mockRequest({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'AB-123-CD'
      });
      const res = mockResponse();

      const mockVehicle = {
        id: 1,
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'AB-123-CD',
        annees: 2022,
        prixLocation: 1500
      };

      Vehicle.create.mockResolvedValue(mockVehicle);

      await createVehicle(req, res);

      expect(Vehicle.create).toHaveBeenCalledWith({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'AB-123-CD',
        annees: expect.any(Number),
        prixLocation: 1500
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockVehicle);
      expect(logger.info).toHaveBeenCalledWith('Vehicle created: AB-123-CD');
    });

    test('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ model: 'Corolla' }); // Missing marque and immatriculation
      const res = mockResponse();

      await createVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing required fields: marque, model, and immatriculation are required"
      });
      expect(Vehicle.create).not.toHaveBeenCalled();
    });

    test('should return 409 if immatriculation already exists', async () => {
      const req = mockRequest({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'AB-123-CD'
      });
      const res = mockResponse();

      const error = new Error('Duplicate immatriculation');
      error.name = 'SequelizeUniqueConstraintError';

      Vehicle.create.mockRejectedValue(error);

      await createVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Vehicle with this immatriculation already exists"
      });
      expect(logger.error).toHaveBeenCalledWith('Create vehicle error:', error);
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest({
        marque: 'Toyota',
        model: 'Corolla',
        immatriculation: 'AB-123-CD'
      });
      const res = mockResponse();

      Vehicle.create.mockRejectedValue(new Error('Database error'));

      await createVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Create vehicle error:', expect.any(Error));
    });
  });

  describe('getAllVehicles', () => {
    test('should return all vehicles', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const mockVehicles = [
        { id: 1, marque: 'Toyota', model: 'Corolla' },
        { id: 2, marque: 'Honda', model: 'Civic' }
      ];

      Vehicle.findAll.mockResolvedValue(mockVehicles);

      await getAllVehicles(req, res);

      expect(Vehicle.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockVehicles);
    });

    test('should return 404 if no vehicles found', async () => {
      const req = mockRequest();
      const res = mockResponse();

      Vehicle.findAll.mockResolvedValue([]);

      await getAllVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No vehicles found" });
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest();
      const res = mockResponse();

      Vehicle.findAll.mockRejectedValue(new Error('Database error'));

      await getAllVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Get vehicles error:', expect.any(Error));
    });
  });

  describe('getVehicleById', () => {
    test('should return vehicle by id', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      const mockVehicle = { id: 1, marque: 'Toyota', model: 'Corolla' };

      Vehicle.findByPk.mockResolvedValue(mockVehicle);

      await getVehicleById(req, res);

      expect(Vehicle.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockVehicle);
    });

    test('should return 404 if vehicle not found', async () => {
      const req = mockRequest({}, { id: '999' });
      const res = mockResponse();

      Vehicle.findByPk.mockResolvedValue(null);

      await getVehicleById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      Vehicle.findByPk.mockRejectedValue(new Error('Database error'));

      await getVehicleById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Get vehicle error:', expect.any(Error));
    });
  });

  describe('updateVehicle', () => {
    test('should update vehicle and return updated data', async () => {
      const req = mockRequest({ marque: 'Updated Toyota' }, { id: '1' });
      const res = mockResponse();

      const mockUpdatedVehicle = { id: 1, marque: 'Updated Toyota', model: 'Corolla' };

      Vehicle.update.mockResolvedValue([1]);
      Vehicle.findByPk.mockResolvedValue(mockUpdatedVehicle);

      await updateVehicle(req, res);

      expect(Vehicle.update).toHaveBeenCalledWith(
        { marque: 'Updated Toyota' },
        { where: { id: '1' } }
      );
      expect(Vehicle.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockUpdatedVehicle);
      expect(logger.info).toHaveBeenCalledWith('Updated vehicle: 1');
    });

    test('should return 404 if vehicle not found', async () => {
      const req = mockRequest({ marque: 'Updated Toyota' }, { id: '999' });
      const res = mockResponse();

      Vehicle.update.mockResolvedValue([0]);

      await updateVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest({ marque: 'Updated Toyota' }, { id: '1' });
      const res = mockResponse();

      Vehicle.update.mockRejectedValue(new Error('Database error'));

      await updateVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Update vehicle error:', expect.any(Error));
    });
  });

  describe('deleteVehicle', () => {
    test('should delete vehicle and return 204', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      Vehicle.destroy.mockResolvedValue(1);

      await deleteVehicle(req, res);

      expect(Vehicle.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Deleted vehicle: 1');
    });

    test('should return 404 if vehicle not found', async () => {
      const req = mockRequest({}, { id: '999' });
      const res = mockResponse();

      Vehicle.destroy.mockResolvedValue(0);

      await deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      Vehicle.destroy.mockRejectedValue(new Error('Database error'));

      await deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Delete vehicle error:', expect.any(Error));
    });
  });

  describe('searchByImmatriculation', () => {
    test('should return vehicle by immatriculation', async () => {
      const req = mockRequest({}, { immatriculation: 'AB-123-CD' });
      const res = mockResponse();

      const mockVehicle = { id: 1, immatriculation: 'AB-123-CD' };

      Vehicle.findOne.mockResolvedValue(mockVehicle);

      await searchByImmatriculation(req, res);

      expect(Vehicle.findOne).toHaveBeenCalledWith({
        where: {
          immatriculation: {
            [Op.iLike]: 'AB-123-CD'
          }
        }
      });
      expect(res.json).toHaveBeenCalledWith(mockVehicle);
    });

    test('should return 404 if vehicle not found', async () => {
      const req = mockRequest({}, { immatriculation: 'ZZ-999-ZZ' });
      const res = mockResponse();

      Vehicle.findOne.mockResolvedValue(null);

      await searchByImmatriculation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest({}, { immatriculation: 'AB-123-CD' });
      const res = mockResponse();

      Vehicle.findOne.mockRejectedValue(new Error('Database error'));

      await searchByImmatriculation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Search vehicle error:', expect.any(Error));
    });
  });

  describe('filterByPrice', () => {
    test('should return vehicles filtered by max price', async () => {
      const req = mockRequest({}, { priceMax: '2000' });
      const res = mockResponse();

      const mockVehicles = [
        { id: 1, prixLocation: 1500 },
        { id: 2, prixLocation: 1800 }
      ];

      Vehicle.findAll.mockResolvedValue(mockVehicles);

      await filterByPrice(req, res);

      expect(Vehicle.findAll).toHaveBeenCalledWith({
        where: {
          prixLocation: {
            [Op.lte]: 2000
          }
        },
        order: [['prixLocation', 'ASC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockVehicles);
    });

    test('should return 400 for invalid price parameter', async () => {
      const req = mockRequest({}, { priceMax: 'invalid' });
      const res = mockResponse();

      await filterByPrice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid price parameter" });
      expect(Vehicle.findAll).not.toHaveBeenCalled();
    });

    test('should return empty array if no vehicles found', async () => {
      const req = mockRequest({}, { priceMax: '1000' });
      const res = mockResponse();

      Vehicle.findAll.mockResolvedValue([]);

      await filterByPrice(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should return 500 on database error', async () => {
      const req = mockRequest({}, { priceMax: '2000' });
      const res = mockResponse();

      Vehicle.findAll.mockRejectedValue(new Error('Database error'));

      await filterByPrice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(logger.error).toHaveBeenCalledWith('Filter vehicles error:', expect.any(Error));
    });
  });
});
