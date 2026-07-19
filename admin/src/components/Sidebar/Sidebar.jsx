import React from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";

const Sidebar = ({ hasNewOrders, setHasNewOrders }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-options">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">dashboard</span>
          <span>Operations</span>
        </NavLink>
        
        <NavLink to="/analytics" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">query_stats</span>
          <span>Revenue Analytics</span>
        </NavLink>
        
        <NavLink to="/add" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">add</span>
          <span>Add Food Item</span>
        </NavLink>
        
        <NavLink to="/list" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">restaurant</span>
          <span>List Food Items</span>
        </NavLink>
        
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}
          onClick={() => {
            if (setHasNewOrders) {
              setHasNewOrders(false);
            }
          }}
        >
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span className="material-symbols-outlined">delivery_dining</span>
            {hasNewOrders && (
              <span style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--md-sys-color-error)",
                border: "1.5px solid var(--md-sys-color-background)"
              }}></span>
            )}
          </span>
          <span>Orders Dashboard</span>
        </NavLink>

        <NavLink to="/admins" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">admin_panel_settings</span>
          <span>Manage Admins</span>
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">group</span>
          <span>Manage Users</span>
        </NavLink>

        <NavLink to="/categories" className={({ isActive }) => `sidebar-option ${isActive ? "active" : ""}`}>
          <span className="material-symbols-outlined">category</span>
          <span>Manage Categories</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
