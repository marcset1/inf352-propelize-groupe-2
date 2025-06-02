import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 10000,
  use: {
    launchOptions: {
      args: ['--allow-file-access-from-files']
    }
  },
  // Active le support des modules ES
  projects: [{
    name: 'chromium',
    use: { 
      contextOptions: {
        strictSelectors: true,
        javaScriptEnabled: true,
      }
    }
  }]
});