projet propelize

# workflow 
### Récupérer les dernières modifications
git fetch origin
git merge origin/main

# Travailler sur sa branche
git add .
git commit -m "Description des modifications"
git push origin votre-nom

# Créer une Pull Request vers main ou develop
Méthode 1 : Depuis GitHub (le plus simple)
Étape 1 : Pousser vos modifications
bashgit add .
git commit -m "Ajout de ma fonctionnalité"
git push origin feature/alice
Étape 2 : Sur GitHub

Allez sur votre repository GitHub
Vous verrez un bandeau jaune qui dit : "feature/alice had recent pushes"
Cliquez sur le bouton vert "Compare & pull request"

Étape 3 : Remplir la Pull Request

Base branch : choisissez main (ou develop)
Compare branch : feature/alice (déjà sélectionné)
Titre : Description courte de vos changements
Description : Expliquez ce que vous avez fait
Cliquez "Create pull request"
