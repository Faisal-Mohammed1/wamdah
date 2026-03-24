// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all the pages we just built
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="app-container" dir="rtl">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h2>الصفحة غير موجودة (404)</h2></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;