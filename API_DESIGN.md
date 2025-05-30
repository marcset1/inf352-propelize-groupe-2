# CONCEPTION DE L'API


### Model / Resources
#### Vehicule
 - Marque: String
 - Model: String
 - Immatriculation: String
 - Annee: Number
 - prixLocation: Number


 ### EndPoints / Points d'extremistes
 ### CRUD

 1. Creer un vehicule
 HTTP POST
 URL: /vehicule
 Request body: entite informations du vehicule

 Response: 201: Vehicule creer
           500: Erreur d'application


2. Mise a jour
HTTP PUT
URL: /vehicule/:id
Request body: entite / information du vehicule

Reponse: 200: Vehicule mise a jour
         500: Erreur d'application

3. Suppression
HTTP DELETE
URL: /vehicule/:id

Reponse: 200: ok
         500: Erreur d'application


4. Lire les informations d'un vehicule a l'aide de son identifiant
HTTP GET
URL: /vehicule/id

Response: 200: vehicule
          404: vehicule non trouver
          500: Erreur d'application

5. Afficher tous les vehicules
HTTP GET
URL: /vehicules

Response: 200: une liste de vehicules
          404: vehicules non trouver
          500: Erreur d'application

6. Lire un vehicule a l'aide de son numero d'immatriculation
HTTP GET
URL: /vehicule/search/:immatriculation

Response: 200: vehicule ok
          404: vehicule non trouver
          500: Erreur d'application

7. Recuperer les vehicules par prix. (filtrer les vehicules par le prix)
HTTP GET
URL /vehicule/price/:prixMax

Response: 200: une liste de vehicules
          404: vehicules non trouver
          500: Erreur d'application