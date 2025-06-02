import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from './logger.js';

// Middleware d'authentification (vérifie le token)
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Access token is required" });
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(403).json({ error: "Invalid token" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Middleware d'autorisation basé sur un tableau de rôles
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    next();
  };
};

// Middleware dédié uniquement aux administrateurs
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

