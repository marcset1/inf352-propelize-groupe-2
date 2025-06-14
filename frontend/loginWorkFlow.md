[] login
    [] Séparation claire entre login et signup (un seul formulaire visible à la fois)

    [] Meilleure gestion des transitions entre les formulaires

    [] Validation améliorée des champs

    [] Feedback visuel plus clair pour l'utilisateur

    [] Code JavaScript mieux organisé
    
    [] effacer le formulaire apres validation
    
    [] l'utilisateur simple ne dois pas pouvoir se connecter a l'interface administrateur et vis-versa
    
    [] passer les tokens et les infos de l'user correctement du back dans le front depuis la connexion
    
    [] utilisateurs qui ne s'affichent pas
		[]Backend:

		    [] Assurez-vous que le middleware d'authentification est correctement configuré

		    [] Vérifiez que ACCESS_TOKEN_SECRET est bien défini dans votre .env

		    [] Ajoutez des logs pour suivre le flux d'authentification

		[]Frontend:

		    [] Utilisez la version améliorée de sendRequest ci-dessus

		    [] Vérifiez que le token est bien stocké dans localStorage après la connexion

		    [] Ajoutez un intercepteur pour gérer les tokens expirés

		[]CORS:

		    [] Configurez CORS pour autoriser le header Authorization
		
		
