## any workflow
```
# 1. Vérifiez les routes enregistrées
curl -X GET http://localhost:3000/vehicles

# 2. Vérifiez la base de données
docker ps
docker exec -it 0bce697f1d7f  psql -U test_user -d test_vehicle_db
psql -U votre_utilisateur -d votre_db -c "SELECT * FROM vehicles;"

# 3. Vérifiez les logs du serveur
tail -f logs/server.log
```

## error:soluce
1. route...op.test.js -> Marc SALLA

```erreur statut ->500 sur annee ou prixLoc manquant : mettre true sur allowNull dans model
```

2. route.test.js -> Jack

```
SequelizeUniqueConstraintError: Validation error
```
Ah, cette erreur SequelizeUniqueConstraintError: Validation error est très révélatrice ! Elle est la cause de tous vos tests en échec.
Le Problème : SequelizeUniqueConstraintError

L'erreur indique clairement que vous essayez d'insérer une ligne dans la base de données qui viole une contrainte d'unicité. La trace d'erreur pointe vers tests/integration/routes.test.js:33:17, qui correspond à cette ligne :
JavaScript

33|    adminUser = await User.create({
34|      name: 'admin',
35|      password: 'admin123',
36|      role: 'admin'
37|    });

Cette erreur se produit parce que vous créez un utilisateur admin (et un utilisateur user) avant chaque test (beforeEach) dans votre routes.test.js.

Votre setup.js contient bien un beforeEach qui fait un await sequelize.sync({ force: true });. Ce sequelize.sync({ force: true }); recrée bien la base de données et toutes ses tables avant chaque test.

Le conflit survient parce que :

    Test 1 (ex: POST /auth/register - should register a new user) :
        tests/setup.js : beforeEach s'exécute, la DB est nettoyée (force: true).
        routes.test.js : beforeEach s'exécute après celui de setup.js, et tente de créer admin et user. Cela réussit.
        Le test POST /auth/register - should register a new user s'exécute.

    Test 2 (ex: POST /auth/register - should fail if username exists) :
        tests/setup.js : beforeEach s'exécute, la DB est nettoyée (force: true).
        routes.test.js : beforeEach s'exécute à nouveau. Il essaie de créer l'utilisateur admin et user. Et c'est là que ça plante ! L'utilisateur admin (ou user) existe déjà parce que la base de données vient d'être nettoyée et que ces utilisateurs sont recréés à chaque beforeEach de routes.test.js avant chaque test.

    ATTENTION : J'ai commis une erreur dans mon raisonnement initial ci-dessus. Si sequelize.sync({ force: true }); s'exécute bien dans le beforeEach de tests/setup.js, alors la base de données est vide avant que le beforeEach de routes.test.js ne s'exécute. Donc, le premier User.create devrait toujours réussir.

    Le vrai problème est le suivant :
    Votre routes.test.js a un beforeEach qui crée adminUser et regularUser. Ce beforeEach s'exécute pour chaque test individuel (it) dans routes.test.js.

    Le test POST /auth/register - should fail if username exists enregistre déjà un utilisateur nommé 'admin' dans son propre corps de test.

    Le beforeEach de routes.test.js crée adminUser (nom: 'admin').
    Ensuite, le test POST /auth/register - should fail if username exists commence par :
    JavaScript

    await request
      .post('/auth/register')
      .send({ name: 'admin', password: 'password123' });

    C'est cette ligne qui échoue ! L'utilisateur 'admin' a déjà été créé par le beforeEach de routes.test.js. Lorsque ce test essaie de créer un autre 'admin', il se heurte à la contrainte d'unicité sur le champ name (ou username) de votre modèle User.

Solution

Vous avez deux beforeEach qui font des choses qui peuvent se chevaucher :

    tests/setup.js's beforeEach: sequelize.sync({ force: true }); (nettoie la DB).
    tests/integration/routes.test.js's beforeEach: Crée adminUser et regularUser.

La clé est de ne créer ces utilisateurs de base qu'une seule fois pour la suite de tests, ou de s'assurer qu'ils sont toujours "frais" et n'entrent pas en conflit avec les tests spécifiques.

La meilleure approche est de déplacer la création de adminUser et regularUser du beforeEach de routes.test.js vers le beforeAll de ce même fichier.
Modification dans tests/integration/routes.test.js

3. Alternative au 2
```
au lieu de sequelize.sync({force: true}); 
- importer le model
- le vider 
-> await User.destroy({ truncate: true, cascade: true });

```

4. alternative au 404 err0r status
```
ici : AssertionError: expected 404 to not deeply equal 404
 ❯ tests/integration/vehicles/routes/vehicle.routes.check-live.test.js:54:28
     52|  // Assert
     53|     expect(res).not.toBeNull();
     54|     expect(res.status).not.toEqual(404); // on verifie que la ressourc…
       |                            ^
     55|   });
     56| });
     
solution: creer cette en amont du test:
beforeEach(() => { 
		request(app)
			.post('/vehicles')
			.send({ marque: 'Test', model: 'Test', immatriculation: 'ABC-107' });
```
