import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentToken } from '../../slices/auth/authSlice';
import serverRoutes from '../../routes/serverRoutes';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import queryString from 'query-string';
const AdminEditVehicle = ({ vehicle, onClose }) => {
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    marque: '',
    model: '',
    immatriculation: '',
    annees: new Date(),
    prixLocation: ''
  });

  const [id, setId] = useState("");
  useEffect(() => {
    const hash = window.location.hash;
    const query = hash.includes("?") ? hash.split("?")[1] : "";
    const { vehicleId } = queryString.parse(query);
    if (vehicleId) {
      setId(vehicleId);
    }
  }, [id]);

  useEffect(() => {
    // Fetch user data by ID
    const fetchVehicle = async () => {
      try {
        const res = await axios.get(`${serverRoutes.VEHICLES}/${id}`, {headers: {Authorization: `Bearer ${token}`}, withCredentials: true});
        setFormData({
          marque: res?.data?.marque,
          model: res?.data?.model,
          immatriculation: res?.data?.immatriculation,
          annees: res?.data?.annees,
          prixLocation: res?.data?.prixLocation       
        });
        setLoading(false);
      } catch (error) {
        setMessage('Error fetching user data.');
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const token = useSelector(selectCurrentToken);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log(vehicle);
    if (vehicle) {
      setFormData({
        marque: vehicle.marque || '',
        model: vehicle.model || '',
        immatriculation: vehicle.immatriculation || '',
        annees: new Date(vehicle.annees, 0), // month is 0-indexed
        prixLocation: vehicle.prixLocation || ''
      });
    }
  }, [vehicle]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      annees: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        annees: formData.annees
      };

      console.log(id);

      await axios.put(`${serverRoutes.VEHICLES}/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      setMessage('Vehicle updated successfully');
      setTimeout(() => {
        navigate('/admin/vehicles');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to update vehicle. Please check your input.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Edit Vehicle</h2>

      {message && <p className="text-green-600 font-semibold mb-4">{message}</p>}
      {error && <p className="text-red-600 font-semibold mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Marque</label>
          <input
            type="text"
            name="marque"
            value={formData.marque}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Model</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Immatriculation</label>
          <input
            type="text"
            name="immatriculation"
            value={formData.immatriculation}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Années</label>
          <DatePicker
            selected={formData.annees}
            onChange={handleDateChange}
            showYearPicker
            dateFormat="yyyy"
            className="p-3 border rounded-lg w-full"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Prix Location</label>
          <input
            type="number"
            name="prixLocation"
            value={formData.prixLocation}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg"
          />
        </div>

        <div className="md:col-span-2 flex justify-between mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Update Vehicle
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminEditVehicle;

