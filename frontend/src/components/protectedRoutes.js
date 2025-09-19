// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const protectedRoutes = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default protectedRoutes;
