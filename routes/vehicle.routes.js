//routes/vehicle.routes.js
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

const router = Router();

router.post('/', createVehicle);
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.get('/search/:immatriculation', searchByImmatriculation);
router.get('/price/:priceMax', filterByPrice);

export default router;