// vitest.config.js (ou à la racine)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/integration/setup.js'],
    include: ['**/*.test.js'],
  }
});
