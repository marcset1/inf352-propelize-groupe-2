import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ServerRouter } from 'react-router-dom';

const Vehicle = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    axios.get(serverRoutes.GET_VEHICLES)
      .then(response => setVehicles(response.data))
      .catch(error => console.error('Error fetching vehicles:', error));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Vehicle Management</h2>
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Make</th>
            <th className="py-3 px-6 text-left">Model</th>
            <th className="py-3 px-6 text-left">Year</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 text-sm">
          {vehicles.map(vehicle => (
            <tr key={vehicle.id} className="border-b hover:bg-gray-100">
              <td className="py-3 px-6">{vehicle.make}</td>
              <td className="py-3 px-6">{vehicle.model}</td>
              <td className="py-3 px-6">{vehicle.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vehicle;
