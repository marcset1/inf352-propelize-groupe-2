
/**
 * @author --> Marc SALLA : 21T2397 
 * @description Teste le fonctionnement des routes des vehicules depuis l'API des vehicules.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { app } from '../../../../app.js';
import request from 'supertest';
import { generatePairwiseCombinations } from '../../../../utils/pairwiseGen.js';
import { 
  vehicleParameters, 
  requiredFields, 
  defaultValues 
} from '../testConfig/vehicleTestParameters.js';


//MOCK PARTIEL a implementer
vi.mock('../../../../controllers/vehicle.controller.js', () => {
  let mockVehicles = [];
  let mockNextId = 1;

  // Fonction utilitaire pour réinitialiser
  const resetMockState = () => {
    mockVehicles = [];
    mockNextId = 1;
  };

  // CREATE
  const mockCreateVehicle = async (req, res) => {
    const { marque, model, immatriculation, annees, prixLocation } = req.body;
	const missingFields = [];
	if(!marque)
	  missingFields.push('marque')
	if(!model)
	  missingFields.push('model')
	if(!immatriculation)
	  missingFields.push('immatriculation')

	if (missingFields.length > 0) {
		return res.status(400).json({ 
		  error: `Champs requis manquants : ${missingFields.join(', ')}` 
		});
	}	
	
    const newVehicle = {
      id: mockNextId++,
      marque,
      model,
      immatriculation,
      annees: annees || new Date().getFullYear(),
      prixLocation: prixLocation || 1500
    };

    mockVehicles.push(newVehicle);
    return res.status(201).json(newVehicle);
  };

  // GET BY ID
  const mockGetVehicleById = async (req, res) => {
    const vehicle = mockVehicles.find(v => v.id === parseInt(req.params.id));
    if (!vehicle) return res.status(404).json({ error: "Véhicule non trouvé" });
    return res.json(vehicle);
  };

  // UPDATE
  const mockUpdateVehicle = async (req, res) => {
    const vehicle = mockVehicles.find(v => v.id === parseInt(req.params.id));
    if (!vehicle) return res.status(404).json({ error: "Véhicule non trouvé" });

    Object.assign(vehicle, req.body);
    return res.json(vehicle);
  };

  // DELETE
  const mockDeleteVehicle = async (req, res) => {
    const index = mockVehicles.findIndex(v => v.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Véhicule non trouvé" });

    mockVehicles.splice(index, 1);
    return res.status(204).send();
  };

  // SEARCH
  const mockSearchByImmatriculation = async (req, res) => {
    const vehicle = mockVehicles.find(v => 
      v.immatriculation === req.params.immatriculation
    );
    if (!vehicle) return res.status(404).json({ error: "Véhicule non trouvé" });
    return res.json(vehicle);
  };

  // FILTER BY PRICE
  const mockFilterByPrice = async (req, res) => {
    const maxPrice = parseFloat(req.params.priceMax);
    if (isNaN(maxPrice)) return res.status(400).json({ error: "Prix invalide" });

    const filtered = mockVehicles.filter(v => v.prixLocation <= maxPrice);
    return res.json(filtered);
  };

  return {
    createVehicle: vi.fn(mockCreateVehicle),
    getAllVehicles: vi.fn(async (req, res) => res.json(mockVehicles)),
    getVehicleById: vi.fn(mockGetVehicleById),
    updateVehicle: vi.fn(mockUpdateVehicle),
    deleteVehicle: vi.fn(mockDeleteVehicle),
    searchByImmatriculation: vi.fn(mockSearchByImmatriculation),
    filterByPrice: vi.fn(mockFilterByPrice),
    _test_resetState: resetMockState
  };
});

// Importe le contrôleur mocké pour pouvoir accéder à ses utilitaires de test (comme _test_resetState)
// Notez que c'est la version mockée qui est importée ici, pas la réelle.


import * as vehicleController from '../../../../controllers/vehicle.controller.js'; // Ajoutez cette ligne


describe('POST /vehicles - Pairwise Testing', () => {
  // Generate test cases with meaningful descriptions
  const getTestCases = () => {
	const pairwiseCases = generatePairwiseCombinations(vehicleParameters);
	
	const specialCases = [
	  {
	    payload: { marque: 'Toyota', model: 'Camry', immatriculation: 'ABC-123-DE' },
	    description: 'should create vehicle when all required fields are provided'
	  },
	  {
	    payload: {},
	    description: 'should reject with 400 when no fields are provided'
	  },
	  {
	    payload: { marque: 'Toyota', model: 'Camry' },
	    description: 'should reject with 400 when immatriculation is missing'
	  }
	];

	return [
	  ...pairwiseCases.map((payload, index) => {
	    const providedFields = Object.keys(payload).filter(k => payload[k] !== '');
	    const missingFields = requiredFields.filter(f => !payload[f] || payload[f] === '');

	    return {
	      payload,
	      description: missingFields.length > 0
	        ? `should reject with 400 when ${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} missing`
	        : `should accept with 201 when providing ${providedFields.join(', ')}`
	    };
	  }),
	  ...specialCases
	];
  };

  const testCases = getTestCases();

  it.each(testCases)('$description', async ({ payload }) => {
	// Determine expected status
	const shouldSucceed = requiredFields.every(f => 
	  payload[f] !== undefined && payload[f] !== ''
	);

	const res = await request(app)
	  .post('/vehicles')
	  .send(payload);

	// Status assertion
	expect(res.status).toBe(shouldSucceed ? 201 : 400);

	// Success case assertions
	if (shouldSucceed) {
	  requiredFields.forEach(field => {
	    expect(res.body).toHaveProperty(field, payload[field]);
	  });
	  
	  expect(res.body.annees).toBe(payload.annees ?? defaultValues.annees);
	  expect(res.body.prixLocation).toBe(payload.prixLocation ?? defaultValues.prixLocation);
	} 
	// Error case assertions
	else {
	  const missingFields = requiredFields.filter(f => 
	    !payload[f] || payload[f] === ''
	  );
	  
	  missingFields.forEach(field => {
	    expect(res.body.error).toContain(field);
	  });
	}
  });
});
