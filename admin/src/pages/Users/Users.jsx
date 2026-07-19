import React, { useEffect, useState } from "react";
import "./Users.css";
import axios from "axios";

const Users = ({ url, token }) => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Fetch registered customer list
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${url}/api/user/list-users`, {
        headers: { token }
      });
      if (response.data.success) {
        setUsersList(response.data.data || []);
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Failed to load users list." });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setStatusMessage({ type: "error", text: "Offline or unable to connect to the backend server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, url]);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Handle blocking/unblocking a customer
  const toggleBlockStatus = async (userId) => {
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/user/toggle-block`, { id: userId }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        await fetchUsers(); // Refresh the list
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error toggling user block status:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update user block status."
      });
    }
  };

  return (
    <div className="users-page dashboard-page-container">
      <div className="users-page-header">
        <h2 className="page-title">Manage Customer Accounts</h2>
        <button className="m3-btn m3-btn-tonal refresh-btn" onClick={fetchUsers} disabled={loading}>
          <span className="material-symbols-outlined">sync</span>
          Refresh Customers
        </button>
      </div>

      {statusMessage.text && (
        <div className={`status-banner m3-card-elevated ${statusMessage.type}`} style={{ marginBottom: "20px" }}>
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="users-loading">
          <div className="m3-spinner"></div>
          <p>Loading registered customers database...</p>
        </div>
      ) : usersList.length === 0 ? (
        <div className="users-empty m3-card m3-card-outlined">
          <span className="material-symbols-outlined empty-icon">group</span>
          <h3>No registered users</h3>
          <p>When clients create accounts on the storefront, they will be listed here.</p>
        </div>
      ) : (
        <div className="users-table m3-card m3-card-outlined">
          <div className="users-table-format header-row">
            <b>Customer Info</b>
            <b>Email Address</b>
            <b>Account Status</b>
            <b>Actions</b>
          </div>
          <hr />
          <div className="users-table-rows">
            {usersList.map((user, index) => {
              const isBlocked = user.isBlocked === true;
              return (
                <div key={user._id || index}>
                  <div className="users-table-format user-item-row">
                    <div className="user-info-wrapper">
                      <span className="material-symbols-outlined user-avatar-icon">person</span>
                      <p className="user-name">{user.name}</p>
                    </div>
                    <p className="user-email">{user.email}</p>
                    <div>
                      <span className={`status-badge ${isBlocked ? "blocked" : "active"}`}>
                        <span className="material-symbols-outlined">
                          {isBlocked ? "block" : "verified_user"}
                        </span>
                        {isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                    <div>
                      <button 
                        type="button" 
                        className={`block-btn ${isBlocked ? "unblock-mode" : "block-mode"}`}
                        onClick={() => toggleBlockStatus(user._id)}
                      >
                        <span className="material-symbols-outlined">
                          {isBlocked ? "lock_open" : "block"}
                        </span>
                        {isBlocked ? "Unblock User" : "Block User"}
                      </button>
                    </div>
                  </div>
                  {index < usersList.length - 1 && <hr />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
