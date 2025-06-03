import React, { useEffect, useState } from 'react';
import axios from 'axios';
import serverRoutes from '../../routes/serverRoutes';
import AdminAddVehicle from './AdminAddVehicle';
import AdminEditVehicle from './AdminEditVehicle';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../../slices/auth/authSlice';
import { Link } from 'react-router-dom';
const AdminVehicle = () => {
  const token = useSelector(selectCurrentToken);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedField, setSelectedField] = useState('marque');
  const [currentPage, setCurrentPage] = useState(1);
  const [vehiclesPerPage] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(serverRoutes.GET_VEHICLES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${serverRoutes.VEHICLES}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setMessage('Vehicle deleted successfully');
      fetchVehicles();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const value = vehicle[selectedField]?.toString().toLowerCase() || '';
    return value.includes(search.toLowerCase());
  });

  const indexOfLast = currentPage * vehiclesPerPage;
  const indexOfFirst = indexOfLast - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  const paginate = (direction) => {
    if (direction === 'next' && currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    if (direction === 'prev' && currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Management</h1>
          <Link
            to={`/admin/vehicles/add`}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 transition-all duration-300"
          >
            <PlusCircle className="w-5 h-5" /> Add Vehicle
          </Link>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <AdminAddVehicle onClose={() => { setShowAddForm(false); fetchVehicles(); }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 rounded-lg border shadow focus:outline-none focus:ring-2"
          />
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-3 py-2 rounded-lg border focus:outline-none"
          >
            <option value="marque">Marque</option>
            <option value="model">Model</option>
            <option value="immatriculation">Immatriculation</option>
            <option value="annees">Années</option>
            <option value="prixLocation">Prix Location</option>
          </select>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-green-600 font-medium text-center mb-4 animate-pulse"
          >
            {message}
          </motion.div>
        )}

        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-6">Marque</th>
                <th className="py-3 px-6">Model</th>
                <th className="py-3 px-6">Immatriculation</th>
                <th className="py-3 px-6">Années</th>
                <th className="py-3 px-6">Prix</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentVehicles.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50 transition-all">
                  <td className="py-3 px-6 text-center">{v.marque}</td>
                  <td className="py-3 px-6 text-center">{v.model}</td>
                  <td className="py-3 px-6 text-center">{v.immatriculation}</td>
                  <td className="py-3 px-6 text-center">{v.annees}</td>
                  <td className="py-3 px-6 text-center">{v.prixLocation}FCFA</td>
                  <td className="py-3 px-6 flex items-center justify-center gap-2">
                    <Link to={`/admin/vehicles/edit?vehicleId=${v.id}`}
                      
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Pencil className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => paginate('prev')}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-lg font-semibold">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => paginate('next')}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <AnimatePresence>
          {editVehicle && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <AdminEditVehicle vehicle={editVehicle} onClose={() => { setEditVehicle(null); fetchVehicles(); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminVehicle;
