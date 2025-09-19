// src/components/StoreOwnerDashboard.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function StoreOwnerDashboard() {
  const [storeData, setStoreData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [passwordUpdate, setPasswordUpdate] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Redirect if not store owner
  useEffect(() => {
    if (!token || role !== "store") {
      navigate("/login");
    }
  }, [token, role, navigate]);

  // Fetch store and ratings
  const fetchStoreAndRatings = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/store/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setStoreData(data.store || null);
      setRatings(Array.isArray(data.ratings) ? data.ratings : []);
    } catch (err) {
      console.error("Error fetching store dashboard:", err);
      setRatings([]);
    }
  }, [token]);

  useEffect(() => {
    fetchStoreAndRatings();
  }, [fetchStoreAndRatings]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!passwordUpdate.oldPassword || !passwordUpdate.newPassword) {
      setPasswordMessage("⚠️ Please fill in both fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/user/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordUpdate),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage("✅ Password updated successfully.");
        setPasswordUpdate({ oldPassword: "", newPassword: "" });
      } else {
        setPasswordMessage(data.error || "❌ Error updating password.");
      }
    } catch (err) {
      console.error(err);
      setPasswordMessage("🚨 Server error while updating password.");
    }
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">🏪 Store Owner Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          🔓 Logout
        </button>
      </div>

      {/* Store Details */}
      <div className="card p-4 shadow-sm mb-4 border-primary">
        <h4 className="text-secondary mb-3">🛍️ Your Store Details</h4>
        {storeData ? (
          <>
            <p className="mb-2">
              <strong>Name:</strong> <span className="text-dark">{storeData.name}</span>
            </p>
            <p className="mb-2">
              <strong>Address:</strong> <span className="text-dark">{storeData.address}</span>
            </p>
            <p className="mb-0">
              <strong>Average Rating:</strong>{" "}
              <span className="badge bg-success">
                {storeData.average_rating
                  ? storeData.average_rating.toFixed(1) + " ⭐"
                  : "No ratings yet"}
              </span>
            </p>
          </>
        ) : (
          <p className="text-muted fst-italic">Loading store details...</p>
        )}
      </div>

      {/* Ratings Section */}
      <div className="card p-4 shadow-sm mb-4 border-info">
        <h5 className="mb-3">💬 Ratings from Users</h5>
        {ratings.length > 0 ? (
          ratings.map((r) => (
            <div
              key={r.id}
              className="border-bottom pb-2 mb-2 d-flex justify-content-between align-items-center"
            >
              <div>
                <p className="mb-1">
                  <strong>User:</strong> {r.user_name}
                </p>
                <p className="mb-0">
                  <strong>Rating:</strong>{" "}
                  <span className="text-warning fw-bold">{r.rating} ⭐</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted fst-italic">No ratings yet.</p>
        )}
      </div>

      {/* Password Update */}
      <div className="card p-4 shadow-sm border-warning">
        <h5 className="mb-3">🔒 Update Password</h5>
        <form onSubmit={handlePasswordUpdate} className="mb-3">
          <input
            type="password"
            placeholder="Old Password"
            className="form-control mb-3"
            value={passwordUpdate.oldPassword}
            onChange={(e) =>
              setPasswordUpdate({ ...passwordUpdate, oldPassword: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="New Password"
            className="form-control mb-3"
            value={passwordUpdate.newPassword}
            onChange={(e) =>
              setPasswordUpdate({ ...passwordUpdate, newPassword: e.target.value })
            }
            required
          />
          <button type="submit" className="btn btn-warning w-100 fw-semibold">
            🔄 Update Password
          </button>
        </form>
        {passwordMessage && (
          <p
            className={`mt-2 ${
              passwordMessage.includes("successfully") ? "text-success" : "text-danger"
            } fw-semibold`}
          >
            {passwordMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default StoreOwnerDashboard;
