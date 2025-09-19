import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous error

    try {
      // <-- FIX: Update URL to match backend
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend responded with error
        setError(data.message || data.error || "Invalid credentials");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        // Role-based navigation
        if (data.role === "admin") navigate("/admin-dashboard");
        else if (data.role === "store") navigate("/store-dashboard");
        else navigate("/user-dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setError("Server error, try again later.");
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
      <div
        className="card shadow border-0 p-4"
        style={{ maxWidth: "420px", width: "100%", borderRadius: "16px", backgroundColor: "#ffffff" }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark">Login to Your Account</h2>
          <p className="text-muted small">Access your dashboard securely</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control rounded-pill px-3 py-2"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-pill px-3 py-2"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-semibold">
            Login
          </button>
        </form>

        {error && (
          <div className="alert alert-danger text-center mt-3 mb-0" role="alert">
            {error}
          </div>
        )}

        <div className="text-center mt-4">
          <p className="small text-muted mb-1">
            Don't have an account?{" "}
            <Link to="/signup" className="text-decoration-none fw-bold text-primary">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
