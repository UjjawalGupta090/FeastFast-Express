import React, { useContext, useState } from "react";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showDropdown, setShowDropdown] = useState(false);
  const { getCartCount, token, setToken, userName, role, setRole, storeSettings } = useContext(StoreContext);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    setToken("");
    setRole("");
    setShowDropdown(false);
    navigate("/");
  };

  const navigateToSection = (sectionId, menuName) => {
    setMenu(menuName);
    if (window.location.pathname !== "/") {
      navigate("/");
      // Wait briefly for client-side navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleHomeClick = () => {
    setMenu("home");
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isOffline = storeSettings?.orderMode === "offline";

  return (
    <>
      {isOffline && (
        <div className="offline-banner" style={{
          width: "100%",
          padding: "12px 16px",
          backgroundColor: "var(--md-sys-color-error)",
          color: "var(--md-sys-color-on-error)",
          textAlign: "center",
          fontWeight: "700",
          fontSize: "0.95rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          position: "sticky",
          top: 0
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>warning</span>
          <span>Restaurant is offline currently. We are not accepting any orders at this moment.</span>
        </div>
      )}
      <nav className="navbar">
      <a href="/" onClick={(e) => { e.preventDefault(); handleHomeClick(); }} className="logo">
        Tomato<span className="logo-dot">.</span>
      </a>
      
      <ul className="navbar-menu">
        <a href="/" onClick={(e) => { e.preventDefault(); handleHomeClick(); }} className={menu === "home" ? "active" : ""}>Home</a>
        <a href="#explore-menu" onClick={(e) => { e.preventDefault(); navigateToSection("explore-menu", "menu"); }} className={menu === "menu" ? "active" : ""}>Menu</a>
        <a href="#footer" onClick={(e) => { e.preventDefault(); navigateToSection("footer", "contact"); }} className={menu === "contact" ? "active" : ""}>Contact Us</a>
      </ul>

      <div className="navbar-right">
        <div className="search-icon-wrapper">
          <span className="material-symbols-outlined nav-icon">search</span>
        </div>
        
        <Link to="/cart" className="navbar-basket">
          <span className="material-symbols-outlined nav-icon">shopping_cart</span>
          {getCartCount() > 0 && <span className="basket-badge">{getCartCount()}</span>}
        </Link>

        {!token ? (
          <button className="m3-btn m3-btn-filled sign-in-btn" onClick={() => setShowLogin(true)}>
            <span className="material-symbols-outlined">login</span>
            Sign In
          </button>
        ) : (
          <div className="navbar-profile-container">
            <button className="navbar-profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
              <span className="profile-name">{userName}</span>
              <span className="material-symbols-outlined dropdown-chevron">
                {showDropdown ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>
            {showDropdown && (
              <div className="profile-dropdown m3-card-elevated">
                <Link to="/myorders" onClick={() => setShowDropdown(false)} className="dropdown-item">
                  <span className="material-symbols-outlined">delivery_dining</span>
                  <span>Orders</span>
                </Link>
                {role === "admin" && (
                  <Link to="/admin" onClick={() => setShowDropdown(false)} className="dropdown-item">
                    <span className="material-symbols-outlined">badge</span>
                    <span>Admin Panel</span>
                  </Link>
                )}
                <hr className="dropdown-divider" />
                <button onClick={logout} className="dropdown-item logout-btn">
                  <span className="material-symbols-outlined">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
    </>
  );
};

export default Navbar;
