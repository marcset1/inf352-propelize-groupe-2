//routes/user.routes.js
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser
} from '../controllers/user.controller.js';

const router = Router();

// Protéger toutes les routes
router.use(authenticate);
router.post('/', authorize(['admin']), createUser);
router.get('/', authorize(['admin']), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize(['admin']), deleteUser);

export default router;