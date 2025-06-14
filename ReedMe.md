# 🚗 PROPELIZE - Application de location de véhicules

**PROPELIZE** est une application web de gestion de location de véhicules développée dans le cadre du projet de fin de semestre du cours **INF352** à l’Université de Yaoundé I.

## 📌 Fonctionnalités

### 🔐 Authentification
- Inscription des utilisateurs
- Connexion sécurisée
- Rôles : `admin` et `utilisateur simple`

### 🚙 Gestion des véhicules
- Création, lecture, modification et suppression de véhicules (CRUD) — réservée aux administrateurs
- Recherche par immatriculation (admin)
- Consultation de la liste des véhicules (utilisateur simple)

### 👤 Gestion des utilisateurs
- CRUD des utilisateurs (admin)
- Affichage du profil utilisateur (utilisateur simple)

## 🏗️ Architecture

- **Backend** : Node.js + Express
- **Frontend** : HTML/CSS/JS classique
- **Base de données** : posgresql
- **Authentification** : JWT
- **Tests** : Vitest & Playwright

##  Structure du projet
inf352-propelize-groupe-2-jack/
├── .env                           
├── .env.test                      
├── .gitignore                    
├── API_DESIGN.md                 
├── WORKFLOWgitpush.md            
├── README.md                     
├── app.js                        
├── index.js                      
├── logger.js                     
├── vitest.config.js              
├── docker-compose.test.yml        
├── index.http                    
├── indexU.http                   
│
├── config/
│   └── db.js                     
│
├── controllers/
│   ├── auth.controller.js         
│   ├── user.controller.js        
│   └── vehicle.controller.js     
│
├── routes/
│   ├── auth.routes.js            
│   ├── user.routes.js            
│   └── vehicle.routes.js         
│
├── data/
│   └── seedData.js                
│
├── front/
│   ├── index.html                
│   ├── styles.css                
│   ├── script.js                 
│   ├── playwright.config.js      
│   └── tests/
│       └── propelize.spec.js     
│
└── tests/
    └── (Vitest test files)


# SI VOUS ETES SUR UBUNTU 

## ⚙️ Installation et démarrage


# 1. Cloner le dépôt
- git clone https://github.com/marcset1/inf352-propelize-groupe-2.git
- cd inf352-propelize-groupe-2-main


# 2. Modification des parametres
 
- Modifier les informations de connection du fichier db.js avec les votres

// Configure database connection based on environment
const sequelize = new Sequelize(
  process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_NAME || 'vehicle_db_test'
    : process.env.DB_NAME || 'vehicle_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'jackkevin',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: msg => logger.debug(msg),
  }
);

- modifier les informations de connection du fichier .env et du fichier .env.test en fonction des votres

.env
DB_NAME=vehicle_db
DB_USER=postgres
DB_PASSWORD=jackkevin
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
ACCESS_TOKEN_SECRET=unsecretcomplexe123
REFRESH_TOKEN_SECRET=unautresecretcomplexe456

.env.test
TEST_DB_NAME=vehicle_db_test
DB_USER=postgres
DB_PASSWORD=jackkevin
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=test
ACCESS_TOKEN_SECRET=secret1234567890
REFRESH_TOKEN_SECRET=secret0987654321


# 3. Installer les dépendances

npm install

# 4. Démarrer le serveur backend
npm run start

# 5. Demarrer le frontend
tapper http-server

# 6. pour effectuer les test front 

1. cd front/
2. npx playwright test

# 7. Pour le Backend avec Vitest
npm run test
npx vitest run --coverage (avec couverture)

📘 Licence

Projet académique développé dans le cadre du cours INF352 à l’Université de Yaoundé I.




