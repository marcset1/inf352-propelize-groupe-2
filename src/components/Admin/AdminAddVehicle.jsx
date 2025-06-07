import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentToken } from '../../slices/auth/authSlice';
import serverRoutes from '../../routes/serverRoutes';

const AdminAddVehicle = ({ onClose }) => {
  const token = useSelector(selectCurrentToken);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    marque: '',
    model: '',
    immatriculation: '',
    annees: currentYear.toString(), // default to current year as string
    prixLocation: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationDateMessage, setValidationDateMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for year field
    if (name === 'annees') {
      const yearValue = parseInt(value);
      if (value === '' || (yearValue >= 1950 && yearValue <= currentYear)) {
        setValidationDateMessage('');
      } else {
        setValidationDateMessage(`Year must be between 1950 and ${currentYear}`);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation check
    /*const yearValue = parseInt(formData.annees);
    if (yearValue < 1950 || yearValue > currentYear) {
      setError('Please enter a valid year between 1950 and current year');
      return;
    }*/

    try {
      const payload = {
        ...formData,
        annees: parseInt(formData.annees) // convert to number
      };

      await axios.post(serverRoutes.VEHICLES, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      setMessage('Vehicle added successfully');
      setTimeout(() => {
        navigate('/admin/vehicles');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to add vehicle. Please check your input.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md" data-testid="add-vehicle-form">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Add New Vehicle</h2>

      {message && <p className="text-green-600 font-semibold mb-4" data-testid="success-message">{message}</p>}
      {error && <p className="text-red-600 font-semibold mb-4" data-testid="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="flex flex-col">
          <label htmlFor='marque' className="mb-1 text-sm font-medium text-gray-700">Marque</label>
          <input
            id="marque"
            type="text"
            name="marque"
            value={formData.marque}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
            data-testid="marque-input"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor='model' className="mb-1 text-sm font-medium text-gray-700">Model</label>
          <input
            id="model"
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
            data-testid="model-input"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor='immatriculation' className="mb-1 text-sm font-medium text-gray-700">Immatriculation</label>
          <input
            type="text"
            name="immatriculation"
            id="immatriculation"
            value={formData.immatriculation}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
            data-testid="immatriculation-input"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor='annees' className="mb-1 text-sm font-medium text-gray-700">Années</label>
          <input
            id="annees"
            type="number"
            name="annees"
            value={formData.annees}
            onChange={handleChange}
            min="1950"
            max={currentYear}
            required
            className="p-3 border rounded-lg"
            data-testid="annees-input"
          />
          {validationDateMessage && (
            <p className="text-red-500 text-xs mt-1" data-testid="date-validation-message">
              {validationDateMessage}
            </p>
          )}
        </div>

        <div className="flex flex-col">
          <label htmlFor='prixLocation' className="mb-1 text-sm font-medium text-gray-700">Prix Location</label>
          <input
            id="prixLocation"
            type="number"
            name="prixLocation"
            value={formData.prixLocation}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
            data-testid="prix-input"
          />
        </div>

        <div className="md:col-span-2 flex justify-between mt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            data-testid="submit-button"
          >
            Add Vehicle
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
            data-testid="cancel-button"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminAddVehicle;