// serverRoutes.js

const API_BASE_URL = 'http://localhost:5000/api/v1';

const serverRoutes = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GET_USERS: `${API_BASE_URL}/users`,
  USERS: `${API_BASE_URL}/users`,
  VEHICLES: `${API_BASE_URL}/vehicles`,
  ADD_USER: `${API_BASE_URL}/users/add`,
  DELETE_USER: `${API_BASE_URL}/users/delete`,
  GET_VEHICLES: `${API_BASE_URL}/vehicles`,
  ADD_VEHICLE: `${API_BASE_URL}/vehicles/add`,
  DELETE_VEHICLE: `${API_BASE_URL}/vehicles/delete`
};
export {API_BASE_URL};
export default serverRoutes;

