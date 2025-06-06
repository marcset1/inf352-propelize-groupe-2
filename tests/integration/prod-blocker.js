// sera mieux used avec un ci (github actions, ...etc)

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests exécutés en dehors de l\'environnement de test !');
}


