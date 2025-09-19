import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [userRatings, setUserRatings] = useState({});
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

useEffect(() => {
  if (!token || role !== "normal") {
    navigate("/login");
  }
}, [token, role, navigate]);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/stores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStores(data);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch("/api/user/ratings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const ratingMap = {};
      data.forEach((r) => (ratingMap[r.store_id] = r.rating));
      setUserRatings(ratingMap);
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchRatings();
  }, []);

  const handleRatingChange = (id, value) => {
    if (value === "" || (value >= 1 && value <= 5)) {
      setUserRatings((prev) => ({ ...prev, [id]: value }));
    }
  };

  const submitRating = async (storeId) => {
    const rating = userRatings[storeId];
    if (!rating || rating < 1 || rating > 5) {
      alert("Please enter a rating between 1 and 5.");
      return;
    }

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ store_id: storeId, rating: Number(rating) }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to submit rating.");
        return;
      }

      alert("Rating submitted!");
      fetchStores();
    } catch (err) {
      alert("Server error while submitting rating.");
      console.error(err);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword } = passwordForm;

    if (!oldPassword || !newPassword) {
      setPasswordMsg("Please fill both fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/user/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const result = await res.json();
      if (res.ok) {
        setPasswordMsg("✅ Password updated successfully.");
        setPasswordForm({ oldPassword: "", newPassword: "" });
      } else {
        setPasswordMsg(`❌ ${result.error || "Update failed"}`);
      }
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordMsg("❌ Server error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const filteredStores = stores.filter((store) =>
    `${store.name} ${store.address}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">User Dashboard</h2>
        <button className="btn btn-outline-danger" onClick={logout}>Logout</button>
      </div>

      {/* Search */}
      <input
        type="text"
        className="form-control mb-4"
        placeholder="Search stores by name or address"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Password Update */}
      <div className="card mb-5 p-4 shadow-sm border border-warning">
        <h5 className="text-warning fw-bold mb-3">Update Password</h5>
        <form onSubmit={updatePassword}>
          <div className="mb-2">
            <input
              type="password"
              className="form-control"
              placeholder="Old Password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-warning w-100">Update Password</button>
        </form>
        {passwordMsg && (
          <div className={`mt-2 fw-semibold ${passwordMsg.includes("✅") ? "text-success" : "text-danger"}`}>
            {passwordMsg}
          </div>
        )}
      </div>

      {/* Store List */}
      {filteredStores.length === 0 ? (
        <p className="text-muted">No stores found.</p>
      ) : (
        <div className="row">
          {filteredStores.map((store) => (
            <div className="col-md-6" key={store.id}>
              <div className="card mb-4 shadow-sm p-3 border-primary">
                <h5 className="text-dark">{store.name}</h5>
                <p className="mb-1 text-muted">📍 {store.address}</p>
                <p className="mb-1">
                  <strong>Overall Rating:</strong>{" "}
                  {store.average_rating != null ? (
                    <span className="badge bg-success">{parseFloat(store.average_rating).toFixed(1)} ⭐</span>
                  ) : (
                    <span className="text-muted">No ratings</span>
                  )}
                </p>
                <p>
                  <strong>Your Rating:</strong>{" "}
                  {userRatings[store.id] ? (
                    <span className="text-warning">{userRatings[store.id]} ⭐</span>
                  ) : (
                    <span className="text-muted">Not rated</span>
                  )}
                </p>

                <div className="d-flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-control w-25"
                    value={userRatings[store.id] || ""}
                    onChange={(e) => handleRatingChange(store.id, e.target.value)}
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => submitRating(store.id)}>
                    {userRatings[store.id] ? "Update Rating" : "Submit Rating"}
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
