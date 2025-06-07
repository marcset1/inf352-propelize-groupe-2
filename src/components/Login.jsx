import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../slices/auth/usersApiSlice';
import { setCredentials } from '../slices/auth/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

try {
  const res = await login({ name: formData.name, password: formData.password }).unwrap();
  dispatch(setCredentials({ ...res }));
  setMessage('Login successful...'); // Make sure this matches test expectation
  setTimeout(() => navigate('/'), 2000);
} catch (err) {
  if (err.response && err.response.status === 404) {
    setMessage('Failed to login...'); // Make sure this matches test expectation
    setIsError(true);
    setTimeout(() => navigate('/register'), 3000);
  } else {
    setMessage(err.data?.message || 'Invalid credentials');
    setIsError(true);
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
        <div 
          className={`text-center text-lg ${isError ? 'text-red-600 animate-bounce' : 'text-green-600 animate-pulse'}`}
          data-testid="auth-message" // Add this
        >
          {message}
        </div>
      )}

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
        disabled={isLoading}
        className={`w-full py-2 rounded-lg font-semibold transition ${
          isLoading 
            ? 'bg-gray-400 text-gray-100 cursor-not-allowed' 
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
        data-testid="login-button"
      >
        {isLoading ? (
          <span data-testid="loading-text">Logging in...</span>
        ) : (
          <span data-testid="login-text">Log In</span>
        )}
      </button>

        <div className='flex text-lg space-x-1 justify-center'>
          <p>Don't have an account?</p>
          <Link className='font-bold text-blue-600 hover:underline' to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;