import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRatings, setUserRatings] = useState({});
  const [passwordUpdate, setPasswordUpdate] = useState({ oldPassword: "", newPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ✅ Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/stores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStores(data);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  }, [token]);

  // ✅ Fetch user ratings
  const fetchUserRatings = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/user/ratings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const ratingMap = {};
      data.forEach((r) => {
        ratingMap[r.store_id] = r.rating;
      });
      setUserRatings(ratingMap);
    } catch (err) {
      console.error("Error fetching user ratings:", err);
    }
  }, [token]);

  // ✅ Redirect if not normal user
  useEffect(() => {
    if (!token || role !== "normal") {
      navigate("/login");
    }
  }, [token, role, navigate]);

  // ✅ Call fetch functions
  useEffect(() => {
    fetchStores();
    fetchUserRatings();
  }, [fetchStores, fetchUserRatings]);

  const handleRatingChange = (storeId, rating) => {
    if (rating === "" || (rating >= 1 && rating <= 5)) {
      setUserRatings((prev) => ({ ...prev, [storeId]: rating }));
    }
  };

  const handleRatingSubmit = async (storeId) => {
    const rating = userRatings[storeId];
    if (!rating || rating < 1 || rating > 5) {
      alert("⚠️ Please enter a rating between 1 and 5.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ store_id: storeId, rating: Number(rating) }),
      });

      if (res.ok) {
        alert("✅ Rating submitted successfully!");
        fetchStores();
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || "Failed to submit rating."}`);
      }
    } catch (err) {
      console.error("Submit rating error:", err);
      alert("🚨 Server error during rating submission.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordUpdate.oldPassword || !passwordUpdate.newPassword) {
      setPasswordMessage("⚠️ Please fill in both password fields.");
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
        setPasswordMessage("✅ Password updated successfully!");
        setPasswordUpdate({ oldPassword: "", newPassword: "" });
      } else {
        setPasswordMessage(`❌ ${data.error || "Failed to update password."}`);
      }
    } catch (err) {
      console.error(err);
      setPasswordMessage("❌ Server error while updating password.");
    }
  };

  const filteredStores = stores.filter((store) =>
    `${store.name} ${store.address}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">👤 User Dashboard</h2>
        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          🔓 Logout
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search stores by name or address"
          className="form-control shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Password Update Section */}
      <div className="card p-4 mb-5 shadow-sm border-warning">
        <h5 className="mb-3 text-warning fw-semibold">🔐 Update Password</h5>
        <form onSubmit={handlePasswordUpdate}>
          <div className="mb-3">
            <input
              type="password"
              placeholder="Old Password"
              className="form-control"
              value={passwordUpdate.oldPassword}
              onChange={(e) =>
                setPasswordUpdate({ ...passwordUpdate, oldPassword: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              placeholder="New Password"
              className="form-control"
              value={passwordUpdate.newPassword}
              onChange={(e) =>
                setPasswordUpdate({ ...passwordUpdate, newPassword: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" className="btn btn-warning fw-semibold w-100">
            🔄 Update Password
          </button>
        </form>
        {passwordMessage && (
          <div
            className={`mt-2 fw-semibold ${
              passwordMessage.includes("successfully") ? "text-success" : "text-danger"
            }`}
          >
            {passwordMessage}
          </div>
        )}
      </div>

      {/* Store List */}
      {filteredStores.length === 0 ? (
        <p className="text-muted fst-italic">No stores found matching your search.</p>
      ) : (
        <div className="row">
          {filteredStores.map((store) => (
            <div key={store.id} className="col-md-6">
              <div className="card mb-4 shadow-sm p-3 border-primary h-100">
                <img
                  src="https://via.placeholder.com/300x180?text=Store+Logo"
                  alt="Store Logo"
                  className="card-img-top rounded mb-3"
                  style={{ height: "180px", objectFit: "cover" }}
                />
                <h5 className="fw-bold text-dark">{store.name}</h5>
                <p className="mb-1 text-muted">📍 {store.address}</p>
                <p className="mb-1">
                  <strong>Overall Rating:</strong>{" "}
                  {store.average_rating ? (
                    <span className="badge bg-success">{store.average_rating.toFixed(1)} ⭐</span>
                  ) : (
                    <span className="text-muted fst-italic">No ratings yet</span>
                  )}
                </p>
                <p className="mb-3">
                  <strong>Your Rating:</strong>{" "}
                  {userRatings[store.id] ? (
                    <span className="text-warning fw-bold">{userRatings[store.id]} ⭐</span>
                  ) : (
                    <span className="text-muted fst-italic">Not rated yet</span>
                  )}
                </p>

                <div className="d-flex align-items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-control w-25 shadow-sm"
                    value={userRatings[store.id] || ""}
                    onChange={(e) => handleRatingChange(store.id, e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-primary fw-semibold"
                    onClick={() => handleRatingSubmit(store.id)}
                  >
                    {userRatings[store.id] ? "🔄 Update Rating" : "⭐ Submit Rating"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
