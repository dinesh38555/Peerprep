// src/components/Shared/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ⏳ Wait until AuthContext finishes checking localStorage
  if (loading) return null; // or show a loader if you want

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
