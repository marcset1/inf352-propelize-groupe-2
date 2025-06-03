export function generatePairwiseCombinations(parameters) {
  const keys = Object.keys(parameters);
  const combinations = [];

  // Generate single parameter combinations
  keys.forEach(key => {
    parameters[key].forEach(value => {
      combinations.push({ [key]: value });
    });
  });

  // Generate pairwise combinations
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const key1 = keys[i];
      const key2 = keys[j];

      parameters[key1].forEach(value1 => {
        parameters[key2].forEach(value2 => {
          combinations.push({ 
            [key1]: value1, 
            [key2]: value2 
          });
        });
      });
    }
  }

  // Remove duplicates
  return combinations.filter((combo, index, self) =>
    index === self.findIndex(c => {
      const entriesA = Object.entries(c).sort();
      const entriesB = Object.entries(combo).sort();
      return JSON.stringify(entriesA) === JSON.stringify(entriesB);
    })
  );
}
