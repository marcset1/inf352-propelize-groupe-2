import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import serverRoutes from '../../routes/serverRoutes';
import queryString from "query-string"
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../../slices/auth/authSlice';
const AdminEditUser = () => {
  const [id, setId] = useState("");
  useEffect(() => {
    const hash = window.location.hash;
    const query = hash.includes("?") ? hash.split("?")[1] : "";
    const { userId } = queryString.parse(query);
    if (userId) {
      setId(userId);
    }
  }, [id]);

  const [formData, setFormData] = useState({ name: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = useSelector(selectCurrentToken);

  console.log(id);

  useEffect(() => {
    // Fetch user data by ID
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${serverRoutes.USERS}/${id}`, {headers: {Authorization: `Bearer ${token}`}, withCredentials: true});
        setFormData({
          name: res?.data.name,
        });
        setLoading(false);
      } catch (error) {
        setMessage('Error fetching user data.');
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  console.log(formData)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`${serverRoutes.USERS}/${id}`, formData, {withCredentials:true, headers: {Authorization: `Bearer ${token}`}})
      .then(() => { setMessage('User updated successfully!') 
        setTimeout(() => {
          navigate('/admin/users')
        })
      })
      .catch(() => setMessage('Error updating user.'));
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>
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
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update User
        </button>
      </form>
    </div>
  );
};

export default AdminEditUser;
