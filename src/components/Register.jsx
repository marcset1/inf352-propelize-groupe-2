// Register.jsx (Password visibility toggle, validation icons/messages)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import serverRoutes from '../routes/serverRoutes';
import { useRegisterMutation } from '../slices/auth/usersApiSlice';

import { useDispatch } from 'react-redux';
const Register = () => {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, password: false });

  const dispatch = useDispatch();
  const [register, {isLoading}] = useRegisterMutation();

  const navigate = useNavigate();

  const nameRegex = /^[a-zA-Z0-9]{4,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

  const validName = nameRegex.test(formData.name);
  const validPassword = passwordRegex.test(formData.password);

  useEffect(() => {
    setIsValid(validName && validPassword);
  }, [validName, validPassword]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    try {
      //const res = await axios.post(serverRoutes.REGISTER, formData);
      const res = await register({name, password});
      setMessage('Successfully registered! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMessage('Registration failed. Please try again.');
      setIsError(true);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-200"
      >
        <h2 className="text-3xl font-extrabold text-center text-teal-800">Register</h2>

        {message && (
          <div data-testid="success-message" className={`text-center text-base font-medium px-2 py-1 rounded transition-all duration-500 ${
            isError ? 'text-red-600 bg-red-100 animate-bounce' : 'text-green-700 bg-green-100 animate-pulse'
          }`}>{message}</div>
        )}

        <div className='flex text-sm justify-center gap-1'>
          <p>Already have an account?</p>
          <Link className='text-blue-600 font-semibold hover:underline' to={`/login`}>Login</Link>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <div className="relative">
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              required
              className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                validName ? 'focus:ring-green-500' : 'focus:ring-red-500'
              }`}
            />
            {touched.name && (
              <span className="absolute right-3 top-3">
                {validName ? <CheckCircle className="text-green-500 w-5 h-5" /> : <XCircle className="text-red-500 w-5 h-5" />}
              </span>
            )}
          </div>
        </div>

        <div>
          <label  htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              data-testid="password-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              required
              className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                validPassword ? 'focus:ring-green-500' : 'focus:ring-red-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-600 focus:outline-none"
              data-testid='password-toggle'
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.password && (
            <p className={`text-xs mt-1 ${validPassword ? 'text-green-600' : 'text-red-500'}`}>
              {validPassword
                ? 'Strong password ✅'
                : 'Password must have 8+ chars, 1 upper, 1 lower, 1 number, 1 special char'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-2 rounded-lg font-semibold transition duration-200 ${
            isValid ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-400 text-gray-100 cursor-not-allowed'
          }`}
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
