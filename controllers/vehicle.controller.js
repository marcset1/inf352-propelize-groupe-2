import Vehicle from '../models/vehicle.model.js';
import { Op } from 'sequelize';
import logger from '../middleware/logger.js';

export const createVehicle = async (req, res) => {
  try {
    const { marque, model, immatriculation, annees, prixLocation } = req.body;

    // Validation basique
    if (!marque || !model || !immatriculation) {
      return res.status(400).json({
        error: "Missing required fields: marque, model, and immatriculation are required"
      });
    }

    const vehicle = await Vehicle.create({
      marque,
      model,
      immatriculation,
      annees: annees || new Date().getFullYear(),
      prixLocation: prixLocation || 1500
    });

    logger.info(`Vehicle created: ${vehicle.immatriculation}`);
    return res.status(201).json(vehicle);
  } catch (error) {
    logger.error('Create vehicle error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: "Vehicle with this immatriculation already exists"
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllVehicles = async (req, res) => {
  try {
    // Si tu as un champ 'disponible', sinon supprime where
    const vehicles = await Vehicle.findAll({ where: { disponible: true } });
    res.status(200).json(vehicles);
  } catch (error) {
    logger.error('Get all vehicles error:', error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    return res.json(vehicle);
  } catch (error) {
    logger.error('Get vehicle error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const [updated] = await Vehicle.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const updatedVehicle = await Vehicle.findByPk(req.params.id);
    logger.info(`Updated vehicle: ${req.params.id}`);
    return res.json(updatedVehicle);
  } catch (error) {
    logger.error('Update vehicle error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    logger.info(`Deleted vehicle: ${req.params.id}`);
    return res.status(204).send();
  } catch (error) {
    logger.error('Delete vehicle error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const searchByImmatriculation = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ where: { immatriculation: req.params.immatriculation } });
    if (!vehicle) return res.status(404).json({ message: "Véhicule non trouvé." });
    res.status(200).json(vehicle);
  } catch (err) {
    logger.error('Search vehicle error:', err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

export const filterByPrice = async (req, res) => {
  try {
    const maxPrice = parseFloat(req.params.priceMax);
    if (isNaN(maxPrice)) {
      return res.status(400).json({ error: "Invalid price parameter" });
    }

    const vehicles = await Vehicle.findAll({
      where: {
        prixLocation: {
          [Op.lte]: maxPrice
        }
      },
      order: [['prixLocation', 'ASC']]
    });

    return res.json(vehicles);
  } catch (error) {
    logger.error('Filter vehicles error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

