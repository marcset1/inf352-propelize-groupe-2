/**
 * @author --> Marc SALLA : 21T2397 
 * @description Teste le fonctionnement des routes des vehicules depuis l'API des vehicules.
 */

import {describe, it, expect, beforeAll, afterAll, afterEach, vi} from 'vitest';
import request from 'supertest' // pour integration/isolation avec le server Express : using without launch

import * as appModule from '../../../../app.js';
const app = appModule.app;

// j'utilise vi.mock pour simuler le les controllers
// every time app ou outre tentera d y acceder, he use this mock

//MOCK PARTIEL a implementer
vi.mock('../../../../controllers/vehicle.controller.js', () => {
  let mockVehicles = [];
  let mockNextId = 1;

  // Fonction utilitaire pour réinitialiser
  const resetMockState = () => {
    mockVehicles = [{
  		id: 123,
		marque: 'Toyota',
		model: 'Camry',
		immatriculation: 'ABC123',
		annees: 2020,
		prixLocation: 100
	}];
    mockNextId = 1;
  };

  // CREATE
  const mockCreateVehicle = async (req, res) => {
    const { marque, model, immatriculation, annees, prixLocation } = req.body;

    if (!marque || !model || !immatriculation) {
      return res.status(400).json({ 
        error: "Champs requis manquants" 
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

//on fait un live-check de la route POST
describe('Vérification des routes de l\'api vehicule par Marc SALLA -- 21T2397', () => {
	afterAll(() => {
	// Cette fonction sera exécutée après chaque test 'it' dans ce bloc 'describe'
	// Tu peux logger l'auteur ici.
	console.log("Test exécuté par : Marc SALLA -- 21T2397");
	});
	
	afterEach(() => {
		vehicleController._test_resetState();
	});
	
  it.each([
    ['GET', '/', 'root endpoint'],
    ['POST', '/vehicles', 'création véhicule'], // Notez le /vehicles au pluriel
    ['PUT', '/vehicles/:id', 'mise à jour véhicule'],
    ['DELETE', '/vehicles/:id', 'suppression véhicule'],
    ['GET', '/vehicles/:id', 'récupération véhicule par ID'],
    ['GET', '/vehicles', 'récupération tous les véhicules'],
    ['GET', '/vehicles/search/:immatriculation', 'recherche par immatriculation'], // Notez le chemin complet
    ['GET', '/vehicles/price/:priceMax', 'filtrage par prix maximum']
  ])('%s %s devrait exister (%s)', async (method, route) => {
    const testRoute = route
      .replace(':id', '123')
      .replace(':immatriculation', 'ABC123')
      .replace(':priceMax', '100');
    
    const res = await request(app)[method.toLowerCase()](testRoute);
    
    expect(res).not.toBeNull();
    expect(res.status).not.toEqual(404); // on verifie que la ressource existe
  });
});

