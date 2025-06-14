import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/integration/setup.js'],
    include: ['tests/integration/**/*.test.js'],
    //exclude: ['routes.test.js'],
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        '*.config.js',
      ]  
    }
  }
});
