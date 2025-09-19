import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0, roleCounts: {} });
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'normal' });
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

        // 1. Get profile & check role
        const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, { headers });
        const userRole = profileRes.data.role;
        setRole(userRole);
        if (userRole !== 'admin') {
          setError('Access Denied: You are not an admin');
          setLoading(false);
          return;
        }

        // 2. Dashboard stats
        const dashboardRes = await axios.get(`${API_BASE_URL}/admin/dashboard`, { headers });
        setStats(dashboardRes.data);

        // 3. All users
        const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, { headers });
        setUsers(usersRes.data);

        // 4. All stores
        const storesRes = await axios.get(`${API_BASE_URL}/admin/stores`, { headers });
        setStores(storesRes.data);

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
    navigate('/login');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value.toLowerCase() }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE_URL}/admin/users`, newUser, { headers });
      alert('User added successfully');
      window.location.reload();
    } catch (err) {
      alert('Error adding user: ' + (err?.response?.data?.message || err.message));
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(filters.name) &&
    user.email?.toLowerCase().includes(filters.email) &&
    user.address?.toLowerCase().includes(filters.address) &&
    (filters.role === '' || user.role?.toLowerCase().includes(filters.role))
  );

  if (loading) {
    return (
      <div className="container py-5">
        <h1 className="text-center">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4 fw-bold text-primary">🛠️ Admin Dashboard</h1>
      {role && (
        <p className="text-center mb-4">
          Logged in as: <span className="badge bg-secondary text-capitalize">{role}</span>
        </p>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow text-center">
            <div className="card-body">
              <i className="bi bi-people-fill fs-1 text-primary"></i>
              <h5 className="card-title mt-3">Total Users</h5>
              <p className="display-6 fw-semibold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow text-center">
            <div className="card-body">
              <i className="bi bi-shop-window fs-1 text-success"></i>
              <h5 className="card-title mt-3">Total Stores</h5>
              <p className="display-6 fw-semibold">{stats.totalStores}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow text-center">
            <div className="card-body">
              <i className="bi bi-star-fill fs-1 text-warning"></i>
              <h5 className="card-title mt-3">Total Ratings</h5>
              <p className="display-6 fw-semibold">{stats.totalRatings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New User */}
      <div className="card shadow mb-5">
        <div className="card-header bg-primary text-white fw-semibold">➕ Add New User</div>
        <div className="card-body row g-3">
          <div className="col-md-3">
            <input
              name="name"
              placeholder="Name"
              className="form-control"
              onChange={handleInputChange}
              value={newUser.name}
              autoComplete="off"
            />
          </div>
          <div className="col-md-3">
            <input
              name="email"
              placeholder="Email"
              className="form-control"
              onChange={handleInputChange}
              value={newUser.email}
              autoComplete="off"
            />
          </div>
          <div className="col-md-2">
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="form-control"
              onChange={handleInputChange}
              value={newUser.password}
              autoComplete="new-password"
            />
          </div>
          <div className="col-md-2">
            <input
              name="address"
              placeholder="Address"
              className="form-control"
              onChange={handleInputChange}
              value={newUser.address}
              autoComplete="off"
            />
          </div>
          <div className="col-md-2">
            <select
              name="role"
              className="form-select"
              onChange={handleInputChange}
              value={newUser.role}
            >
              <option value="normal">Normal</option>
              <option value="store">Store</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="col-12 text-end mt-2">
            <button className="btn btn-success" onClick={handleAddUser}>
              <i className="bi bi-plus-circle me-1"></i> Add User
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <h4 className="mb-3 fw-semibold">🔍 Filter Users</h4>
      <div className="row g-3 mb-4">
        {['name', 'email', 'address', 'role'].map((field) => (
          <div className="col-md-3" key={field}>
            <input
              type="text"
              className="form-control"
              placeholder={`Filter by ${field}`}
              name={field}
              onChange={handleFilterChange}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      {/* Users List */}
      <div className="card shadow mb-5">
        <div className="card-header bg-info text-white fw-semibold">👥 All Users</div>
        <div className="card-body table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.address}</td>
                  <td>
                    <span className="badge bg-secondary">{user.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stores List */}
      <div className="card shadow mb-5">
        <div className="card-header bg-warning text-dark fw-semibold">🏬 All Stores</div>
        <div className="card-body table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td>{store.name}</td>
                  <td>{store.address}</td>
                  <td>{store.owner_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default AdminDashboard;
