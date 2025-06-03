import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import serverRoutes from '../routes/serverRoutes';
import { setCredentials } from '../slices/auth/authSlice';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../slices/auth/usersApiSlice';
const Login = () => {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const [login, {isLoading}] = useLoginMutation();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    try {
      console.log(formData);
      const res = await login({name: formData.name, password: formData.password}).unwrap();
      console.log(res);
      //console.log(res);
      dispatch(setCredentials({...res}));
      setMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setMessage('User not registered. Redirecting to register...');
        setIsError(true);
        setTimeout(() => navigate('/register'), 3000);
      } else {
        setMessage('Invalid credentials');
        setIsError(true);
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-200"
      >
        <h2 className="text-3xl font-extrabold text-center text-teal-800">Propelize</h2>
        {message && (
          <div className={`text-center text-lg ${isError ? 'text-red-600 animate-bounce' : 'text-green-600 animate-pulse'}`}>{message}</div>
        )}

        <div className='flex text-lg space-x-1'>
          <p>Already have an account</p>
          <Link className='font-bold ' to={`/register`}>Register</Link>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700 font-semibold transition"
        >
          Log In
        </button>
      </form>
    </div>
  );
};

export default Login;