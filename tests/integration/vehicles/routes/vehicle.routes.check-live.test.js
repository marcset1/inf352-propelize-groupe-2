/**
 * @author --> Marc SALLA : 21T2397 
 * @description Teste le fonctionnement des routes des vehicules depuis l'API des vehicules.
 */

import {describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi} from 'vitest';
import request from 'supertest' // pour integration/isolation avec le server Express : using without launch

import * as appModule from '../../../../app.js';
const app = appModule.app;


//on fait un live-check des routes
describe('MUT: vehicle.route -> test par Marc SALLA -- 21T2397', () => {
	afterAll(() => {
	// Cette fonction sera exécutée après chaque test 'it' dans ce bloc 'describe'
	// Tu peux logger l'auteur ici.
	console.log("Test exécuté par : Marc SALLA -- 21T2397");
	});
	
	beforeEach(() => { 
		request(app)
			.post('/vehicles')
			.send({ marque: 'Test', model: 'Test', immatriculation: 'ABC-107' }); // epargner les cas de delete et put sur immatriculation
	});
	
  it.each([
    ['GET', '/', 'root endpoint'],
    ['POST', '/vehicles', 'création véhicule'], // Notez le /vehicles au pluriel
    ['DELETE', '/vehicles/:id', 'suppression véhicule effectuee'],
    ['PUT', '/vehicles/:id', 'mise à jour véhicule'],
    ['GET', '/vehicles/:id', 'récupération véhicule par ID'],
    ['GET', '/vehicles', 'récupération tous les véhicules'],
    ['GET', '/vehicles/search/:immatriculation', 'recherche par immatriculation'], // Notez le chemin complet
    ['GET', '/vehicles/price/:priceMax', 'filtrage par prix maximum'],
    
  ])('%s %s devrait exister pour (%s)', async (method, route) => {
  
	// Arrange
    const testRoute = route
      .replace(':id', '39d6e26c-5062-45ae-ba2 0-87a7c297b1f2')
      .replace(':immatriculation', 'ABC-107')
      .replace(':priceMax', '100');
    
    //if(method.toLowerCase()=='')
    
	// Act
    const res = await request(app)
    	[method.toLowerCase()](testRoute)
    		.send({ marque: 'Test', model: 'Test', immatriculation: 'ABC-107' }); // objet des donnees de test aussi

	// Assert
    expect(res).not.toBeNull();
    expect(res.status).not.toEqual(404); // on verifie que la ressource existe
  });
});

