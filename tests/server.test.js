import {describe, it, expect} from 'vitest';
import request from 'supertest';
import * as appModule from '../app.js'

const app = appModule.app;

describe("SERVER HTPP BASICS", ()=>{
	//TEST1: verifie que le server repond aux requetes
	it("doit retourner 200 pour GET /healthcheck", async ()=>{
		const response = await request(app).get('/');
		expect(response.status).toBe(200);
		expect(response.text).toMatch(/Vehicle Rental API Service/i);
	});
});
