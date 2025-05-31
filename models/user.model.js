// models/user.model.js - Version corrigée
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING, // Changé de ENUM à STRING
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'admin']] // Validation au niveau application
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
  timestamps: true,
  tableName: 'Users' // Nom explicite de la table
});

// Méthode pour comparer les mots de passe
User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default User;