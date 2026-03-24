import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Check if a user is saved in localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 1. If the user is not logged in at all, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If the user is logged in, but doesn't have the required role, redirect to home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // They are a standard member trying to access an admin page
    return <Navigate to="/" replace />; 
  }

  // 3. If they pass the checks, render the component they asked for!
  return children;
};

export default ProtectedRoute;