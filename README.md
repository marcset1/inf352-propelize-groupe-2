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
├── .env      # Variables d'environnement                      
├── .env.test        # Variables pour tests                 
├── .gitignore                    
├── API_DESIGN.md       # Schéma de conception de l’API REST            
├── WORKFLOWgitpush.md            
├── README.md                    
├── app.js   # Point d'entrée principal                     
├── index.js                      
├── logger.js                     
├── vitest.config.js              
├── docker-compose.test.yml        
├── index.http                    
├── indexU.http                   
│
├── config/                    # Configuration (BD)
│   └── db.js                     
│
├── controllers/                    # Logique métier
│   ├── auth.controller.js         
│   ├── user.controller.js        
│   └── vehicle.controller.js     
│
├── routes/                        # Définition des routes API
│   ├── auth.routes.js            
│   ├── user.routes.js            
│   └── vehicle.routes.js         
│
├── data/                       #Fichiers de seed
│   └── seedData.js                
│
├── front/                      # Interface utilisateur
│   ├── index.html                
│   ├── styles.css                
│   ├── script.js                 
│   ├── playwright.config.js      
│   └── tests/
│       └── propelize.spec.js       # Tests de l’interface 
│
└── tests/                          # tests backend 
    └── (Vitest test files)


# SI VOUS ETES SUR UBUNTU 

## ⚙️ Installation et démarrage


# 1. Cloner le dépôt

# 2. Base de donnée
importer la base de donnée posgres et changer les informations du model bd.js qui se trouve dans le dossier config

nom de la bd : vehicle_db

 modifier également les informations du fichier .env en fonction des votres 
 
 modifier également le fichier .env.test en insérer insérant vos données
 ### .éléménts à modifier 
 
 le nom de l'utilisateur de la bd : DB_USER
 
 
git clone https://github.com/votre-projet/propelize.git
cd propelize

# 3. Installer les dépendances

npm install

# 4. Démarrer le serveur backend
npm start

# 5. Ouvrir le frontend
Ouvrir front/index.html dans votre navigateur

# 6. pour effectuer les test front 

cd front/
npx playwright install
npx playwright test

# 7. Pour le Backend avec Vitest
 
npm run test


#SI VOUS ETES SUR WINDOWS

## ⚙️ Installation et démarrage


# 1. Cloner le projet
git clone https://github.com/votre-projet/propelize.git
cd propelize

# 2. Installer les dépendances

npm install

# 3. créer votre bd posgresql 

# 4. Démarrer le backend

npm start

# 5. Ouvrir le frontend (double-cliquer ou via PowerShell)

start front/index.html


📘 Licence

Projet académique développé dans le cadre du cours INF352 à l’Université de Yaoundé I.




