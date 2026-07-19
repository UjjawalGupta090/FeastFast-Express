import React from "react";
import "./Navbar.css";

const Navbar = ({ onLogout }) => {
  const adminName = localStorage.getItem("userName") || "Admin";
  const avatarLetter = adminName.charAt(0).toUpperCase();

  return (
    <header className="admin-navbar">
      <div className="navbar-logo-section">
        <h1 className="logo">Tomato Admin</h1>
        <span className="panel-badge">M3 Dashboard</span>
      </div>
      <div className="navbar-profile">
        <div className="avatar">{avatarLetter}</div>
        <div className="profile-details">
          <span className="profile-name">{adminName}</span>
          <span className="profile-tag">Admin</span>
        </div>
        <button onClick={onLogout} className="m3-btn m3-btn-text logout-btn" style={{
          padding: "6px 12px",
          color: "var(--md-sys-color-error)",
          fontSize: "0.8rem",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>logout</span>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
