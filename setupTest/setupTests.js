import { initializeTestDatabase } from '../utils/initializeTestDatabase.js';

beforeAll(async () => {
  await initializeTestDatabase();
});