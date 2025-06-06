//routes/auth.routes.js
import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;