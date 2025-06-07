// App.jsx
import React from 'react';
import {Routes, Route, HashRouter, BrowserRouter } from 'react-router-dom';
import Home from './components/Home';
import AdminDashboard from './components/Admin/AdminDashboard';
import Vehicle from './components/Admin/Vehicle';
import AdminAddUser from './components/Admin/AdminAddUser';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Login from './components/Login';
import AdminVehicle from './components/Admin/AdminVehicle';
import AdminUser from './components/Admin/AdminUser';
import AdminEditUser from './components/Admin/AdminEditUser';
import AdminAddVehicle from './components/Admin/AdminAddVehicle';
import AdminEditVehicle from './components/Admin/AdminEditVehicle';
const App = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/vehicles" element={<Vehicle />} />
            <Route path="/admin/users" element={<AdminUser/>} />
            <Route path="/admin/users/add" element={<AdminAddUser />} />
            <Route path="/admin/users/edit" element={<AdminEditUser/>}/>
            <Route path="/admin/vehicles" element={<AdminVehicle/>}/>
            <Route path="/admin/vehicles/add" element={<AdminAddVehicle/>}/>
            <Route path="/admin/vehicles/edit" element={<AdminEditVehicle/>}/>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
