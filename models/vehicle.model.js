import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  marque: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  immatriculation: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  annees: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  prixLocation: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['immatriculation'],
      unique: true,
    },
    {
      fields: ['prixLocation'],
    }
  ]
});

export default Vehicle;