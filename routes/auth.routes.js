import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  register,
  login,
  refreshToken,
  logout
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  register
);

router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  login
);

router.post('/refresh', refreshToken);

router.post('/logout', authenticate, logout);

export default router;

