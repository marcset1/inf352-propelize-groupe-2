import React, { useState } from 'react';
import axios from 'axios';
import serverRoutes from '../../routes/serverRoutes';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../../slices/auth/authSlice';
const AdminAddUser = () => {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const navigate = useNavigate();
  const token = useSelector(selectCurrentToken);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(serverRoutes.USERS, formData, {withCredentials: true, headers: {Authorization: `Bearer ${token}`}})
      .then(res =>  {setMessage('User added successfully!')
        setTimeout(() => {
          navigate('/admin/users')
        }, [2000])
      })
      .catch(err => setMessage('Error adding user.'));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Add New User</h2>
      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add User</button>
      </form>
    </div>
  );
};

export default AdminAddUser;