/**
*@description: on mock tout ce qui ne va pas a nos cordes
*
*/
export const vehicleParameters = {
  marque: ['Toyota', 'Honda', ''],
  model: ['Camry', 'Civic', ''],
  immatriculation: ['ABC-123-DE', 'XYZ-987-FG', ''],
  annees: [2020, null, 2023],
  prixLocation: [1000.50, null, 2500.00]
};

export const requiredFields = ['marque', 'model', 'immatriculation'];

export const defaultValues = {
  annees: new Date().getFullYear(),
  prixLocation: 1500
};
