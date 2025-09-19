import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("normal");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, address, role }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Signup successful! Please login.");
        navigate("/login");
      } else {
        alert(data.error || "Signup failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex justify-content-center align-items-center">
      <div
        className="card shadow p-4"
        style={{ maxWidth: "500px", width: "100%", borderRadius: "16px" }}
      >
        <h2 className="text-center mb-3 text-primary fw-bold">
          Create Your Account
        </h2>
        <p className="text-center text-muted mb-4">
          Join us and explore the best stores 🚀
        </p>

        <form onSubmit={handleSignup}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Full Name</label>
            <input
              type="text"
              className="form-control rounded-pill px-3 py-2"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control rounded-pill px-3 py-2"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-pill px-3 py-2"
              placeholder="Enter strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Address</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="mb-4">
  <label className="form-label fw-semibold">Role</label>
  <select
    className={`form-select ${role === "" ? "text-muted" : ""}`}
    value={role}
    onChange={(e) => setRole(e.target.value)}
    required
  >
    <option value="">Select User</option>
    <option value="normal">Normal User</option>
    <option value="store">Store Owner</option>
  </select>
</div>


          <button
            type="submit"
            className="btn btn-primary w-100 rounded-pill fw-semibold py-2"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-muted mt-4 mb-0">
          Already have an account?{" "}
          <a href="/login" className="text-primary fw-bold text-decoration-none">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
