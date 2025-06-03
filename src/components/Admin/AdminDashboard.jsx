import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/vehicles" className="bg-blue-600 text-white p-6 rounded-xl shadow hover:bg-blue-700">
          Manage Vehicles
        </Link>
        <Link to="/users" className="bg-green-600 text-white p-6 rounded-xl shadow hover:bg-green-700">
          Manage Users
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
