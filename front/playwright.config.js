/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    testDir: './tests', // Dossier où les tests seront stockés
    timeout: 30000, // Temps max par test (30s)
    use: {
      headless: true, // Exécuter les tests sans interface graphique
      viewport: { width: 1280, height: 720 }, // Taille de la fenêtre
      browserName: 'chromium', // Navigateur par défaut
    },
    projects: [
      {
        name: 'chromium',
        use: { browserName: 'chromium' },
      },
      {
        name: 'firefox',
        use: { browserName: 'firefox' },
      },
      {
        name: 'webkit',
        use: { browserName: 'webkit' },
      },
    ],
  };
  module.exports = config;