// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Configuration globale
    globals: true,
    environment: 'node',
    
    // Configuration de la couverture
    coverage: {
      provider: 'v8', // ou 'c8'
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Seuils de couverture
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90
      },
      
      // Fichiers à inclure/exclure
      include: [
        'src/**/*.js',
        'controllers/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js'
      ],
      exclude: [
        'node_modules/**',
        'test/**',
        'tests/**',
        '**/*.test.js',
        '**/*.spec.js',
        'coverage/**',
        'dist/**'
      ],
      
      // Analyse par branche pour une couverture plus précise
      all: true,
      skipFull: false,
      
      // Rapports détaillés
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95]
      }
    },
    
    // Configuration des mocks
    clearMocks: true,
    restoreMocks: true,
    
    // Timeout pour les tests
    testTimeout: 10000,
    
    // Pattern des fichiers de test
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ]
  }
});

// package.json scripts recommandés
export const packageScripts = {
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage:open": "vitest run --coverage && open coverage/index.html"
  }
};