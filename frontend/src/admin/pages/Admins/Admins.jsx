import React, { useEffect, useState } from "react";
import "./Admins.css";
import axios from "axios";

const Admins = ({ url, token }) => {
  const [adminsList, setAdminsList] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password Change Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Helper to parse JWT token to find currently logged-in administrator user ID
  const getLoggedInAdminId = () => {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const loggedInId = getLoggedInAdminId();
  const loggedInAdmin = adminsList.find((admin) => admin._id === loggedInId);
  const isSuperAdmin = loggedInAdmin?.email === "admin@tomato.com";

  // Fetch registered administrators list
  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${url}/api/user/list-admins`, {
        headers: { token }
      });
      if (response.data.success) {
        setAdminsList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching administrators:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdmins();
    }
  }, [token, url]);

  // Auto-hide status banner after 2.5 seconds for cleaner UX
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage.text]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "", text: "" });
    setSubmitting(true);

    try {
      const response = await axios.post(`${url}/api/user/add-admin`, formData, {
        headers: { token }
      });
      if (response.data.success) {
        setFormData({ name: "", email: "", password: "" });
        setStatusMessage({ type: "success", text: response.data.message });
        fetchAdmins(); // Refresh admin list
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error adding administrator:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create administrator account."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to remove administrator "${admin.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.post(`${url}/api/user/remove-admin`, { id: admin._id }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        fetchAdmins(); // Refresh admin list
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error removing administrator:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to remove administrator account."
      });
    }
  };

  const openPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const handlePasswordChangeSubmit = async (event) => {
    event.preventDefault();
    setPasswordSubmitting(true);

    try {
      const response = await axios.post(`${url}/api/user/change-admin-password`, {
        id: selectedAdmin._id,
        newPassword
      }, {
        headers: { token }
      });

      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        setShowPasswordModal(false);
        setNewPassword("");
        setSelectedAdmin(null);
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update administrator password."
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleManageAccess = async (targetAdminId, action) => {
    try {
      const response = await axios.post(`${url}/api/user/manage-analytical-access`, {
        targetAdminId,
        action
      }, { headers: { token } });

      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        fetchAdmins(); // Refresh admin list
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error managing analytical access:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update access status."
      });
    }
  };

  return (
    <div className="admins-page dashboard-page-container">
      <h2 className="page-title">Manage Administrators</h2>
      
      <div className="admins-grid">
        {/* Left Side: Create Admin Form */}
        <div className="create-admin-section m3-card m3-card-outlined">
          {!isSuperAdmin ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "40px 16px",
              height: "100%",
              gap: "16px"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--md-sys-color-error)" }}>lock</span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--md-sys-color-on-surface)" }}>Access Restricted</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--md-sys-color-on-surface-variant)", lineHeight: "1.4" }}>
                Only the **Super Admin** (admin@tomato.com) is authorized to register new administrators or manage active accounts.
              </p>
            </div>
          ) : (
            <>
              <h3 className="section-title">Add New Admin</h3>
              <p className="section-description">
                Create a new administrative account. Administrators can manage catalog items, process customer orders, and view database dashboard metrics.
              </p>

              <form className="add-admin-form" onSubmit={onSubmitHandler}>
                {statusMessage.text && (
                  <div className={`status-banner m3-card-elevated ${statusMessage.type}`} style={{ marginBottom: "16px" }}>
                    {statusMessage.text}
                  </div>
                )}

                <div className="m3-text-field">
                  <input
                    type="text"
                    name="name"
                    onChange={onChangeHandler}
                    value={formData.name}
                    placeholder=" "
                    required
                  />
                  <label>Full Name</label>
                </div>

                <div className="m3-text-field">
                  <input
                    type="email"
                    name="email"
                    onChange={onChangeHandler}
                    value={formData.email}
                    placeholder=" "
                    required
                  />
                  <label>Email Address</label>
                </div>

                <div className="m3-text-field">
                  <input
                    type="password"
                    name="password"
                    onChange={onChangeHandler}
                    value={formData.password}
                    placeholder=" "
                    required
                    minLength="8"
                  />
                  <label>Temporary Password (min 8 chars)</label>
                </div>

                <button type="submit" className="m3-btn m3-btn-filled submit-btn" disabled={submitting}>
                  <span className="material-symbols-outlined">add_moderator</span>
                  {submitting ? "Creating..." : "Register Admin"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Side: List of Current Admins */}
        <div className="admins-list-section m3-card m3-card-outlined">
          <h3 className="section-title">Current Admins</h3>
          
          {loading ? (
            <div className="loading-container">
              <p>Loading administration list...</p>
            </div>
          ) : (
            <div className="admins-table-wrapper">
              <div 
                className="admins-table-header"
                style={{ gridTemplateColumns: isSuperAdmin ? "1.2fr 1.6fr 0.8fr 1.8fr 1fr" : "1.2fr 1.8fr 1fr" }}
              >
                <b>Name</b>
                <b>Email</b>
                <b>Role</b>
                {isSuperAdmin && <b>Analytical Access</b>}
                {isSuperAdmin && <b style={{ textAlign: "right", paddingRight: "16px" }}>Actions</b>}
              </div>
              <hr />
              <div className="admins-table-rows">
                {adminsList.map((admin, index) => (
                  <div key={admin._id || index}>
                    <div 
                      className="admins-table-row"
                      style={{ gridTemplateColumns: isSuperAdmin ? "1.2fr 1.6fr 0.8fr 1.8fr 1fr" : "1.2fr 1.8fr 1fr" }}
                    >
                      <div className="admin-name-wrapper">
                        <span className="material-symbols-outlined admin-avatar-icon">shield_person</span>
                        <p className="admin-name">{admin.name}</p>
                      </div>
                      <p className="admin-email">{admin.email}</p>
                      <p className="admin-role-badge">
                        {admin.email === "admin@tomato.com" ? "Super Admin" : "Admin"}
                      </p>
                      {isSuperAdmin && (
                        <div className="access-control-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {admin.email === "admin@tomato.com" ? (
                            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--md-sys-color-primary)", backgroundColor: "var(--md-sys-color-primary-container)", padding: "4px 8px", borderRadius: "12px" }}>
                              Granted (Owner)
                            </span>
                          ) : (
                            <>
                              <span style={{
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                textTransform: "capitalize",
                                backgroundColor: 
                                  admin.analyticalAccess === "approved" ? "var(--md-sys-color-primary-container)" :
                                  admin.analyticalAccess === "pending" ? "var(--md-sys-color-tertiary-container)" :
                                  admin.analyticalAccess === "rejected" ? "var(--md-sys-color-error-container)" :
                                  "var(--md-sys-color-surface-container-high)",
                                color: 
                                  admin.analyticalAccess === "approved" ? "var(--md-sys-color-on-primary-container)" :
                                  admin.analyticalAccess === "pending" ? "var(--md-sys-color-on-tertiary-container)" :
                                  admin.analyticalAccess === "rejected" ? "var(--md-sys-color-on-error-container)" :
                                  "var(--md-sys-color-on-surface-variant)"
                              }}>
                                {admin.analyticalAccess || "No Access"}
                              </span>

                              <div style={{ display: "flex", gap: "6px" }}>
                                {admin.analyticalAccess === "pending" && (
                                  <>
                                    <button 
                                      type="button" 
                                      title="Approve Request"
                                      onClick={() => handleManageAccess(admin._id, "approve")}
                                      style={{ background: "none", border: "none", color: "var(--md-sys-color-primary)", cursor: "pointer", display: "flex", padding: "2px" }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>check_circle</span>
                                    </button>
                                    <button 
                                      type="button" 
                                      title="Reject Request"
                                      onClick={() => handleManageAccess(admin._id, "reject")}
                                      style={{ background: "none", border: "none", color: "var(--md-sys-color-error)", cursor: "pointer", display: "flex", padding: "2px" }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>cancel</span>
                                    </button>
                                  </>
                                )}
                                {admin.analyticalAccess === "approved" && (
                                  <button 
                                    type="button" 
                                    title="Revoke Access"
                                    onClick={() => handleManageAccess(admin._id, "revoke")}
                                    style={{ background: "none", border: "none", color: "var(--md-sys-color-error)", cursor: "pointer", display: "flex", padding: "2px" }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>lock</span>
                                  </button>
                                )}
                                {(admin.analyticalAccess === "none" || admin.analyticalAccess === "rejected" || !admin.analyticalAccess) && (
                                  <button 
                                    type="button" 
                                    title="Grant Access"
                                    onClick={() => handleManageAccess(admin._id, "grant")}
                                    style={{ background: "none", border: "none", color: "var(--md-sys-color-primary)", cursor: "pointer", display: "flex", padding: "2px" }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>lock_open</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {isSuperAdmin && (
                        <div className="admin-actions">
                          <span 
                            className="material-symbols-outlined action-btn edit-btn" 
                            title="Change Password"
                            onClick={() => openPasswordModal(admin)}
                          >
                            vpn_key
                          </span>
                          {admin._id !== loggedInId && (
                            <span 
                              className="material-symbols-outlined action-btn delete-btn" 
                              title="Remove Admin"
                              onClick={() => handleRemoveAdmin(admin)}
                            >
                              delete
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {index < adminsList.length - 1 && <hr className="row-divider" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Dialog Modal */}
      {showPasswordModal && (
        <div className="m3-dialog-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="m3-dialog m3-card m3-card-elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Change Password</h3>
            <p className="dialog-description">
              Set a new security password for <b>{selectedAdmin?.name}</b> ({selectedAdmin?.email}).
            </p>
            
            <form onSubmit={handlePasswordChangeSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
              <div className="m3-text-field">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder=" "
                  required
                  minLength="8"
                />
                <label>New Password (min 8 chars)</label>
              </div>
              
              <div className="dialog-actions">
                <button 
                  type="button" 
                  className="m3-btn m3-btn-text" 
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="m3-btn m3-btn-filled" 
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
