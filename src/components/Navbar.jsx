import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, UserCircle, LogOut } from 'lucide-react';
import { BASE_URL } from '../routes/clientRoutes';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    navigate('/login');
    
  };

  console.log(user?.user?.role);

  return (
    <nav data-testid="navbar" className="bg-gray-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-2xl font-bold">🚀 Propelize</h1>

<button
  className="flex items-center space-x-2 hover:underline"
  onClick={() => setProfileOpen(!profileOpen)}
  data-testid="profile-toggle"  // Add this
  aria-expanded={profileOpen}
  aria-controls="profile-dropdown"
>
  <UserCircle className="w-5 h-5" />
  <span data-testid="user-display-name">{user?.user?.name}</span>
</button>
        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/admin/vehicles" className="hover:underline">Vehicles</Link>
          {user?.user?.role === 'admin' && (
            <Link to="/admin/users" className="hover:underline">Users</Link>
          )}
          {!user ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <div className="relative">
              <button
                className="flex items-center space-x-2 hover:underline"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <UserCircle className="w-5 h-5" />
                <span>{user?.name}</span>
              </button>

              {profileOpen && (
                <div data-testid="profile-dropdown" className="absolute right-0 mt-2 bg-white text-gray-800 rounded-md shadow-lg py-2 z-20 w-48">
                  <div className="px-4 py-2 border-b text-sm">
                    Logged in as <strong>{user?.user?.name}</strong>
                  </div>
                  <button
                    data-testid="logout-button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div data-testid="mobile-menu-button" className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {menuOpen && (
        <div data-testid="mobile-menu" className="md:hidden mt-3 space-y-2 bg-gray-700 text-white px-4 py-2 rounded-lg">
          <Link to="/" className="block hover:underline">Home</Link>
          <Link to="/admin/vehicles" className="block hover:underline">Vehicles</Link>
          {user?.role === 'admin' && (
            <Link to="/admin/users" className="block hover:underline">Users</Link>
          )}
          <Link to="/admin/users" className="block hover:underline">Users</Link>
          {!user ? (
            <>
              <Link to="/login" className="block hover:underline">Login</Link>
              <Link to="/register" className="block hover:underline">Register</Link>
            </>
          ) : (
            <>
              <div  className="border-t border-gray-600 pt-2 text-sm text-gray-300">
                Logged in as <strong>{user?.user?.name}</strong>
              </div>
              <button
                onClick={handleLogout}
                className="text-left text-red-300 hover:text-red-500"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
