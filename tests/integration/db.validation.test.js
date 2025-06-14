// tests/integration/db.validation.test.js
import sequelize from '../../config/db.js'; // Chemin relatif corrigé
import { describe, it } from 'vitest';

describe('Validation de la DB de test', () => {
  it('doit utiliser la DB de test', async () => {
    // Vérification que sequelize est bien initialisé
    if (!sequelize) {
      throw new Error('Sequelize non initialisé !');
    }
    
    const [result] = await sequelize.query("SELECT current_database()");
    const dbName = result[0].current_database;
    
    if (!dbName.includes('test')) {
      throw new Error(`MAUVAISE DB UTILISÉE : ${dbName}`);
    }
  });
});
