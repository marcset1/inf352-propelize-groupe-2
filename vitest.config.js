import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    globals: true,
    exclude: [
      'front/**', 
      'node_modules/**',
      'dist/**',
      'tests/'
    ],
    include: ['tests/integration/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'front/**', // Exclude front/ from coverage
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'front/**',
        'app.js',
        'index.js',
        'setupTests.js',
        'utils/**',
        'pairwiseGen.js',
        'vehicle-user-frontend/**',
        'setupTest/**',
        'vitest.config.js',
        '**/logger.js',
        '**/*.config.js',
      ],
    },
  },
});
