import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000, // Augmentez si nécessaire
  retries: 1,
  workers: 1, // Réduisez à 1 worker pour les tests locaux
  webServer: {
    command: 'npx serve -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
		name: 'firefox',
		use: { ...devices['Desktop Firefox'] },
    },
  ],
});
