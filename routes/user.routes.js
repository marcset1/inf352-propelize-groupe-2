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

// Routes réservées aux admins
router.post('/', authorize(['admin']), createUser);
router.get('/', authorize(['admin']), getUsers);
router.delete('/:id', authorize(['admin']), deleteUser);

// Routes accessibles aux utilisateurs authentifiés
router.get('/:id', getUser);
router.put('/update/:id', updateUser); // plus besoin de 'authenticate' ici

export default router;




