import React, { useEffect, useState } from 'react';
import axios from 'axios';
import serverRoutes from '../../routes/serverRoutes';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../../slices/auth/authSlice';
import { format } from 'timeago.js';
import { Pencil, Trash2 } from 'lucide-react';

const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const token = useSelector(selectCurrentToken);

  useEffect(() => {
    const getUsers = async () => {
      const res = await axios.get(serverRoutes.GET_USERS, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res?.data);
    };

    getUsers();
  }, [token]);

  function handleDelete(id) {
      axios
        .delete(`${serverRoutes.USERS}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        })
        .then(() => {
          setUsers(prev => prev.filter(user => user.id !== id));
        })
        .catch(err => {
          console.error('Delete failed', err);
        });
    console.log(users);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Link
          to="/admin/users/add"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add User
        </Link>
      </div>

      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Name</th>
            <th className="py-3 px-6 text-left">Created</th>
            <th className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700 text-sm">
          {users.map(user => (
            <tr key={user.id} className="border-b hover:bg-gray-100">
              <td className="py-3 px-6">{user.name}</td>
              <td className="py-3 px-6">{format(user.createdAt)}</td>
              <td className="py-3 px-6 text-center flex justify-center gap-4">
                <Link
                  to={`/admin/users/edit?userId=${user.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Pencil size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


};

export default AdminUser;

