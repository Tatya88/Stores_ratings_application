import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container-fluid bg-light min-vh-100 d-flex flex-column justify-content-center align-items-center text-center">
      <div className="p-5 shadow bg-white rounded-4" style={{ maxWidth: "500px", width: "100%" }}>
        <h1 className="mb-4 fw-bold text-primary">Welcome to Store Rating App</h1>
        <p className="text-muted mb-4">
          Rate, review, and explore the best stores around you.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/signup" className="btn btn-outline-primary px-4 rounded-pill">
            Sign Up
          </Link>
          <Link to="/login" className="btn btn-primary px-4 rounded-pill">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
