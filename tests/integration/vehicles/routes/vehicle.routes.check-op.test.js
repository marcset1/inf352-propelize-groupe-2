
/**
 * @author --> Marc SALLA : 21T2397 
 * @description Teste le fonctionnement des routes des vehicules depuis l'API des vehicules.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { app } from '../../../../app.js';
import request from 'supertest';
import { generatePairwiseCombinations } from '../../../../utils/pairwiseGen.js';
import { 
  vehicleParameters, // tous les parametres a combiner
  requiredFields, // les champs requis pour valider un vehicule
  defaultValues // application de certaines valeurs valeurs par defaut a certains champs
} from '../testConfig/vehicleTestParameters.js'; // les parametres pour le pairwise testing

// Notez que c'est la version mockée qui est importée ici, pas la réelle.

import * as vehicleController from '../../../../controllers/vehicle.controller.js'; // Ajoutez cette ligne

describe('POST /vehicles - Pairwise Testing', () => {

	afterAll(() => {
	// Cette fonction sera exécutée après chaque test 'it' dans ce bloc 'describe'
	// Tu peux logger l'auteur ici.
	console.log("Test exécuté par : Marc SALLA -- 21T2397");
	});

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
	// application et recuperation des cas de tests par pairwise combinations
	const testCases = getTestCases();
	
	
	/* ici on verifie juste que les post fonctionnent normalement et non les duplicats, ... : objet d'un autre test */
	
	// lancement du reseau de test
	it.each(testCases)('$description', async ({ payload }) => {
		// Determine expected status: shouldSucceed vaut 'faux' si un des champs requis vaut 'nul' ou 'undefined'
		const shouldSucceed = requiredFields.every(f => 
		  payload[f] !== undefined && payload[f] !== ''
		);
		
		// application d'une requete POST telle qu'il se doit
		const res = await request(app)
		  .post('/vehicles')
		  .send(payload); // par sortie de pairwise combination

		// Status assertion
		if (res.status === 409) {
			console.warn(`Conflit détecté pour ${payload.immatriculation}`);
		} 
		else {
			expect(res.status).toBe(shouldSucceed ? 201 : 400); // 201 uniquement en cas de 'true' sur shouldSucceed
		

			// Success case assertions
			if (shouldSucceed) {
			  requiredFields.forEach(field => {
				expect(res.body).toHaveProperty(field, payload[field]);
			  });
			  
			  expect(res.body.annees).toBe(payload.annees ?? defaultValues.annees); // annee doit avoir une valeur par defaut au moins
			  expect(res.body.prixLocation).toBe(payload.prixLocation ?? defaultValues.prixLocation); // le prix aussi a
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
		}
	});
});
