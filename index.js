import express from 'express';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; // Ajout de l'import jwt

// Charger les variables d'environnement EN PREMIER
dotenv.config();

// Import utilities
import logger from './middleware/logger.js';

// Import database
import { sequelize, connectDB } from './config/db.js';

// Import modèles (IMPORTANT !)
import './models/user.model.js';
import './models/vehicle.model.js';
// ajoute d'autres modèles ici si nécessaire

// Import seeders
import { seedAll } from './data/seedData.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';

const app = express();

///// Middleware CORS - Correction: Utiliser l'import existant /////
app.use(cors({
  origin: 'http://localhost:8000', // Autorisez spécifiquement votre frontend
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Servir les fichiers statiques
app.use(express.static('public'));

// Logger HTTP
app.use(pinoHttp({ logger }));

// Body parser
app.use(bodyParser.json());

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
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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
  
  // Ici vous devriez utiliser votre modèle Sequelize
  // Exemple: User.findAll().then(users => ...)
  res.json({ 
    success: true, 
    users: [] // À remplacer par les données réelles
  });
});

// Monter les routes avec préfixe /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    message: 'Vehicle Rental API Service',
    timestamp: new Date().toISOString(),
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Initialiser la base de données
const initializeApp = async () => {
  try {
    await connectDB(); // connecte PostgreSQL
    
    await sequelize.sync({ alter: true }); // synchronise tous les modèles
    console.log('✅ Modèles synchronisés avec la base de données');
    
    await seedAll(); // si tu as des données initiales à insérer
    logger.info('Database initialized and seeded successfully');
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Lancer l'initialisation
initializeApp();
