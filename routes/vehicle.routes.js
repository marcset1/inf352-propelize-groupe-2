import { Router } from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchByImmatriculation,
  filterByPrice
} from '../controllers/vehicle.controller.js';

import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Routes publiques ou accessibles aux utilisateurs connectés
router.get('/', authenticate, getAllVehicles);
router.get('/search/:immatriculation', authenticate, searchByImmatriculation);
router.get('/price/:priceMax', authenticate, filterByPrice);
router.get('/:id', authenticate, getVehicleById);

// Routes sécurisées (admin uniquement)
router.post('/', authenticate, requireAdmin, createVehicle);
router.put('/:id', authenticate, requireAdmin, updateVehicle);
router.delete('/:id', authenticate, requireAdmin, deleteVehicle);

export default router;

