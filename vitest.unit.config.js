// vitest.unit.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pas de setupFiles pour les tests unitaires, car ils ne dépendent pas de la DB
    // setupFiles: [],

    // Inclure les fichiers de test unitaires spécifiques.
    // Par exemple, si tes tests unitaires sont dans tests/controller/unit, tests/model/unit, etc.
    include: [
      './tests/unit/**/*.test.js',
      './tests/helpers/**/*.test.js' // Si tu as des tests pour tes helpers
      // Ajoutez d'autres chemins si nécessaire pour tes tests unitaires
    ],

    // Exclure les tests d'intégration pour cette configuration unitaire
    exclude: [
        './tests/integration/**/*.test.js',
        // Si tu as d'autres tests non-unitaires que tu veux ignorer ici
    ],

    environment: 'node',
    testTimeout: 5000, // Les tests unitaires devraient être plus rapides
    hookTimeout: 5000,
    teardownTimeout: 5000,
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      // Assure-toi que les fichiers de test eux-mêmes sont exclus de la couverture
      exclude: [
        'node_modules/',
        'tests/', // Important : exclut tous les fichiers dans le dossier tests/
        'coverage/',
        '*.config.js',
        'inf352-propelize-groupe-2/*.js'
        // Si tes fichiers de code source sont dans des dossiers spécifiques, tu peux les inclure ici.
        // Par exemple, si tes contrôleurs sont dans 'src/controllers', tu pourrais ajouter:
        // '!src/controllers/**/*.js', // Pour inclure toutes les sources sauf les tests
      ],
      // La collection de couverture devrait cibler tes fichiers de code source, pas les tests
      // Exemple: collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js']
    }
  }
});
