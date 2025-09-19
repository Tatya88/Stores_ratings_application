import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5001/api';

const StoreOwnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordUpdate, setPasswordUpdate] = useState({
    oldPassword: '',
    newPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = { Authorization: `Bearer ${token}` };

        const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });
        const userRole = profileRes.data.role;
        setRole(userRole);
        if (userRole !== 'store') {
          setError('Access Denied: You are not a store owner');
          setLoading(false);
          return;
        }

        // 2. Store dashboard data
        const dashboardRes = await axios.get(`${API_BASE_URL}/stores/dashboard`, { headers });
        setStores(dashboardRes.data.stores);
        if (dashboardRes.data.stores.length > 0) {
          setSelectedStore(dashboardRes.data.stores[0]);
          // Fetch ratings for the first store
          const ratingsRes = await axios.get(`${API_BASE_URL}/stores/${dashboardRes.data.stores[0].id}/ratings`, { headers });
          setRatings(ratingsRes.data.ratings);
        }

        setLoading(false);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          (err?.response?.status === 404
            ? 'API endpoint not found (404). Is your backend running?'
            : 'Failed to load data')
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const ratingsRes = await axios.get(`${API_BASE_URL}/stores/${store.id}/ratings`, { headers });
      setRatings(ratingsRes.data.ratings);
    } catch (err) {
      setError('Failed to fetch ratings for selected store');
    }
  };

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!passwordUpdate.oldPassword || !passwordUpdate.newPassword) {
      setPasswordMessage('Please fill in both fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE_URL}/user/update-password`, passwordUpdate, { headers });
      setPasswordMessage('Password updated successfully.');
      setPasswordUpdate({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMessage('Error updating password: ' + (err?.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <h1 className="text-center">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4 fw-bold text-primary">
        <i className="bi bi-shop-window me-2"></i>Store Owner Dashboard
      </h1>
      {role && (
        <p className="text-center mb-4">
          Logged in as: <span className="badge bg-secondary text-capitalize">{role}</span>
        </p>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search and Select Stores */}
      <div className="card border-0 shadow mb-5">
        <div className="card-header bg-secondary text-white fw-semibold">
          <i className="bi bi-search me-2"></i>Search and Select Store
        </div>
        <div className="card-body">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search stores by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <select
              className="form-select"
              value={selectedStore?.id || ''}
              onChange={(e) => {
                const store = stores.find(s => s.id === parseInt(e.target.value));
                if (store) handleStoreSelect(store);
              }}
            >
              {filteredStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} - Avg Rating: {store.average_rating || 'N/A'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Store Details Card */}
      <div className="card border-0 shadow mb-5">
        <div className="card-header bg-primary text-white fw-semibold">
          <i className="bi bi-info-circle me-2"></i>Selected Store Details
        </div>
        <div className="card-body">
          {selectedStore ? (
            <div className="row g-3">
              <div className="col-md-4">
                <div className="text-center">
                  <i className="bi bi-building fs-1 text-primary"></i>
                  <h5 className="mt-3">Store Name</h5>
                  <p className="fw-semibold">{selectedStore.name}</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <i className="bi bi-geo-alt fs-1 text-success"></i>
                  <h5 className="mt-3">Address</h5>
                  <p className="fw-semibold">{selectedStore.address}</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <i className="bi bi-star-fill fs-1 text-warning"></i>
                  <h5 className="mt-3">Average Rating</h5>
                  <p className="display-6 fw-semibold">
                    {selectedStore.average_rating ? `${selectedStore.average_rating} ⭐` : 'No ratings yet'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted text-center">No store selected.</p>
          )}
        </div>
      </div>

      {/* Ratings List */}
      <div className="card border-0 shadow mb-5">
        <div className="card-header bg-info text-white fw-semibold">
          <i className="bi bi-chat-dots me-2"></i>Ratings from Users
        </div>
        <div className="card-body table-responsive">
          {ratings.length > 0 ? (
            <table className="table table-hover table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>User Name</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td>{rating.user_name}</td>
                    <td>
                      <span className="badge bg-warning text-dark fw-semibold">
                        {rating.rating} <i className="bi bi-star-fill"></i>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted text-center">No ratings yet.</p>
          )}
        </div>
      </div>

      {/* Update Password */}
      <div className="card border-0 shadow mb-5">
        <div className="card-header bg-warning text-dark fw-semibold">
          <i className="bi bi-shield-lock me-2"></i>Update Password
        </div>
        <div className="card-body">
          <form onSubmit={handlePasswordUpdate} className="row g-3">
            <div className="col-md-6">
              <input
                type="password"
                placeholder="Old Password"
                className="form-control"
                value={passwordUpdate.oldPassword}
                onChange={(e) =>
                  setPasswordUpdate({ ...passwordUpdate, oldPassword: e.target.value })
                }
                required
                autoComplete="current-password"
              />
            </div>
            <div className="col-md-6">
              <input
                type="password"
                placeholder="New Password"
                className="form-control"
                value={passwordUpdate.newPassword}
                onChange={(e) =>
                  setPasswordUpdate({ ...passwordUpdate, newPassword: e.target.value })
                }
                required
                autoComplete="new-password"
              />
            </div>
            <div className="col-12 text-end">
              <button type="submit" className="btn btn-warning fw-semibold">
                <i className="bi bi-arrow-repeat me-1"></i>Update Password
              </button>
            </div>
          </form>
          {passwordMessage && (
            <div className={`alert mt-3 ${passwordMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>
              {passwordMessage}
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="text-center mt-5">
        <button className="btn btn-outline-danger btn-lg px-4" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>Logout
        </button>
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;
