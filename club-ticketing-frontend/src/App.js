// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all the pages we just built
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
// Import our new security wrapper
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="app-container" dir="rtl">
        <Routes>
          {/* Public Routes - Anyone can access these to sign up or log in */}
          <Route path="/" element={<Home />} />
  <Route path="/register" element={<Register />} />
  <Route path="/login" element={<Login />} />
          
          {/* Protected Member Route - Any logged-in, approved user can access this */}
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