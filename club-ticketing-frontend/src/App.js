// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all the pages
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin'; 
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';

// Import our security wrapper
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="app-container" dir="rtl">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} /> {/* <-- The exact path! */}
          
          {/* Protected Member Route - Only for logged-in users */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Admin Route - ONLY gate_admin or super_admin can access this */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['gate_admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h2>الصفحة غير موجودة (404)</h2></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;