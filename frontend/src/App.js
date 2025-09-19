import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Signup from "./components/Signup";
import Login from "./components/Login";
import Home from "./components/Home";
import ProtectedRoute from "./components/protectedRoutes";
import UserDashboard from "./pages/userDashboard";
import StoreOwnerDashboard from "./components/StoreOwnerDashboard";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard (Public for now, you can wrap in ProtectedRoute later) */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Protected Routes */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute allowedRoles={["normal"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/store-dashboard"
          element={
            <ProtectedRoute allowedRoles={["store"]}>
              <StoreOwnerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
