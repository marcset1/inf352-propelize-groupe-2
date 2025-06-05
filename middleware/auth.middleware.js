import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from './logger.js';

// Middleware d'authentification
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access token is required" });
    }

    const token = authHeader.split(' ')[1];

    // Vérification et décodage du token JWT
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Recherche de l'utilisateur dans la base de données
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(403).json({ error: "Invalid token: user not found" });
    }

    // Ajout de l'utilisateur à la requête pour les middlewares suivants
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    // Gestion spécifique des erreurs JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(403).json({ error: "Authentication failed" });
  }
};

// Middleware d'autorisation basé sur les rôles
export const authorize = (roles = []) => {
  // Accepte un rôle unique sous forme de string également
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized: insufficient permissions" });
    }

    next();
  };
};

// Middleware réservé uniquement aux administrateurs (optionnel, peut être remplacé par authorize('admin'))
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
};

