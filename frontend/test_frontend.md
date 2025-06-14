# login/register
## cas de test 1
**Description:** Vérifier que les formulaires de login et signup sont bien séparés et s'affichent un à la fois
```gherkin
Scenario: Séparation claire entre login et signup
  Given Je suis sur la page d'accueil de Propelize
  And Le formulaire de login est visible
  When Je clique sur le lien "Créer un compte"
  Then Le formulaire de login disparaît
  And Le formulaire de signup apparaît
  And Aucun des deux formulaires n'est visible simultanément

  When Je clique sur le bouton "Retour" ou "Se connecter"
  Then Le formulaire de signup disparaît
  And Le formulaire de login réapparaît
```

1. Installez Playwright : npm init playwright@latest

2. Placez ces tests dans le dossier tests

3. Lancez les tests : npx playwright test
