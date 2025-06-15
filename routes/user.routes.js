// routes/user.routes.js
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  getCurrentUser
} from '../controllers/user.controller.js';

const router = Router();

// Protect all routes
router.use(authenticate);

// Routes - IMPORTANT: /me doit être AVANT /:id
router.get('/me', getCurrentUser);  // Route pour le profil utilisateur actuel
router.post('/', authorize(['admin']), createUser);
router.get('/', authorize(['admin']), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize(['admin']), deleteUser);

export default router;