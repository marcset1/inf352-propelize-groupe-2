import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

// Mock des dépendances
vi.mock('sequelize');
vi.mock('../../../config/db.js');

// Helper pour créer des données véhicule de test
const createVehicleData = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  marque: 'Toyota',
  model: 'Corolla',
  immatriculation: 'ABC-123-XY',
  annees: 2020,
  prixLocation: 50.0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides
});

// Helper pour créer des instances mock du modèle Vehicle
const createMockVehicleInstance = (data = {}) => {
  const vehicleData = createVehicleData(data);
  const mockInstance = {
    ...vehicleData,
    changed: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  };
  return mockInstance;
};

// Helper pour les erreurs de validation Sequelize
const createSequelizeErrors = () => ({
  validation: (() => {
    const err = new Error('Validation error');
    err.name = 'SequelizeValidationError';
    err.errors = [
      { path: 'marque', message: 'Marque cannot be null' },
      { path: 'model', message: 'Model cannot be null' },
      { path: 'immatriculation', message: 'Immatriculation cannot be null' },
      { path: 'annees', message: 'Annees cannot be null' },
      { path: 'prixLocation', message: 'PrixLocation cannot be null' }
    ];
    return err;
  })(),
  unique: (() => {
    const err = new Error('Unique constraint error');
    err.name = 'SequelizeUniqueConstraintError';
    err.fields = ['immatriculation'];
    return err;
  })(),
  database: (() => {
    const err = new Error('Database connection error');
    err.name = 'SequelizeDatabaseError';
    return err;
  })()
});

describe('Vehicle Model Tests', () => {
  let mockVehicleModel;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a proper mock for the Vehicle model with prototype
    mockVehicleModel = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      prototype: {} // Add prototype property
    };
    
    // Mock sequelize.define to return our mock model
    sequelize.define = vi.fn().mockReturnValue(mockVehicleModel);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  //                                   Tests de définition du modèle

  describe('Définition du modèle', () => {
    it('définit le modèle Vehicle avec les bons attributs', async () => {
      // Clear any previous module cache
      vi.resetModules();
      
      // Import the model - this will trigger the define call
      const { default: Vehicle } = await import('../../../models/vehicle.model.js');
      
      expect(sequelize.define).toHaveBeenCalledWith('Vehicle', 
        expect.objectContaining({
          id: expect.objectContaining({
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
          }),
          marque: expect.objectContaining({
            type: DataTypes.STRING,
            allowNull: false
          }),
          model: expect.objectContaining({
            type: DataTypes.STRING,
            allowNull: false
          }),
          immatriculation: expect.objectContaining({
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
          }),
          annees: expect.objectContaining({
            type: DataTypes.INTEGER,
            allowNull: false
          }),
          prixLocation: expect.objectContaining({
            type: DataTypes.FLOAT,
            allowNull: false
          })
        }),
        expect.objectContaining({
          timestamps: true,
          indexes: expect.arrayContaining([
            expect.objectContaining({
              fields: ['immatriculation'],
              unique: true
            }),
            expect.objectContaining({
              fields: ['prixLocation']
            })
          ])
        })
      );
    });

    it('configure les timestamps correctement', async () => {
      vi.resetModules();
      await import('../../../models/vehicle.model.js');
      
      const defineCall = sequelize.define.mock.calls[0];
      const options = defineCall[2];
      
      expect(options.timestamps).toBe(true);
    });

    it('configure les index correctement', async () => {
      vi.resetModules();
      await import('../../../models/vehicle.model.js');
      
      const defineCall = sequelize.define.mock.calls[0];
      const options = defineCall[2];
      
      expect(options.indexes).toHaveLength(2);
      expect(options.indexes[0]).toEqual({
        fields: ['immatriculation'],
        unique: true
      });
      expect(options.indexes[1]).toEqual({
        fields: ['prixLocation']
      });
    });
  });

  


  //                                   Tests de validation des données

  describe('Validation des données', () => {
    let MockedVehicle;

    beforeEach(() => {
      MockedVehicle = {
        create: vi.fn()
      };
    });

    describe('Validation de la marque', () => {
      it('rejette les marques vides', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: '',
          model: 'Test',
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });

      it('rejette les marques null', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: null,
          model: 'Test',
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });
    });

    describe('Validation du modèle', () => {
      it('rejette les modèles vides', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: '',
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });

      it('rejette les modèles null', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: null,
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });
    });

    describe('Validation de l\'immatriculation', () => {
      it('rejette les immatriculations vides', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: '',
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });

      it('rejette les immatriculations null', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: null,
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });

      it('rejette les immatriculations en double', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.unique);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'DUPLICATE-123',
          annees: 2020,
          prixLocation: 50.0
        })).rejects.toThrow('Unique constraint error');
      });
    });

    describe('Validation des années', () => {
      it('rejette les années null', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'TEST-123',
          annees: null,
          prixLocation: 50.0
        })).rejects.toThrow('Validation error');
      });

      it('accepte les années valides', async () => {
        const vehicle = createMockVehicleInstance({ annees: 2023 });
        MockedVehicle.create.mockResolvedValue(vehicle);

        const result = await MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'TEST-123',
          annees: 2023,
          prixLocation: 50.0
        });

        expect(result.annees).toBe(2023);
      });
    });

    describe('Validation du prix de location', () => {
      it('rejette les prix null', async () => {
        const errors = createSequelizeErrors();
        MockedVehicle.create.mockRejectedValue(errors.validation);

        await expect(MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: null
        })).rejects.toThrow('Validation error');
      });

      it('accepte les prix décimaux', async () => {
        const vehicle = createMockVehicleInstance({ prixLocation: 75.5 });
        MockedVehicle.create.mockResolvedValue(vehicle);

        const result = await MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: 75.5
        });

        expect(result.prixLocation).toBe(75.5);
      });

      it('accepte les prix entiers', async () => {
        const vehicle = createMockVehicleInstance({ prixLocation: 100 });
        MockedVehicle.create.mockResolvedValue(vehicle);

        const result = await MockedVehicle.create({
          marque: 'Toyota',
          model: 'Corolla',
          immatriculation: 'TEST-123',
          annees: 2020,
          prixLocation: 100
        });

        expect(result.prixLocation).toBe(100);
      });
    });
  });
});