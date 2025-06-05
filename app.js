// index.js
import express from 'express';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';

// Import utilities
import logger from './middleware/logger.js';

// Import database and seeders
import { connectDB } from './config/db.js';
import { seedAll } from './data/seedData.js'; // pour seed initial

// Import routes
import vehicleRoutes from './routes/vehicle.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();

// 1) Activer CORS (pour autoriser http://localhost:8000)
app.use(
  cors({
    origin: 'http://localhost:8000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// 2) Logger HTTP (pino)
app.use(pinoHttp({ logger }));

// 3) Parser le JSON dans le corps des requêtes
app.use(bodyParser.json());

// 4) Monter les routes en veillant à utiliser le préfixe /api/auth
app.use('/api/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/vehicles', vehicleRoutes);

// 5) Health check (GET /)
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Vehicle Rental API Service',
    timestamp: new Date().toISOString(),
  });
});

// 6) Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// server.js - Ajoutez ce middleware CORS
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:8000', // Autorisez spécifiquement votre frontend
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware d'authentification amélioré
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token d\'authentification manquant' 
    });
  }
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error('Erreur de vérification du token:', err);
      return res.status(403).json({ 
        success: false, 
        message: 'Token invalide ou expiré' 
      });
    }
    
    req.user = user;
    next();
  });
};

// Exemple de route protégée
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès non autorisé' 
    });
  }
  
  // Récupération des utilisateurs depuis la base de données
  db.all('SELECT id, fullname, username, role FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur de base de données' 
      });
    }
    
    res.json({ 
      success: true, 
      users: rows 
    });
  });
});


// 7) Initialiser la base de données et semer les données
const initializeApp = async () => {
  try {
    // 7.1) Connexion à PostgreSQL
    await connectDB();

    // 7.2) Seeder (users, vehicles…)
    await seedAll();
    logger.info('Database initialized and seeded successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
};
initializeApp();


export { app };

