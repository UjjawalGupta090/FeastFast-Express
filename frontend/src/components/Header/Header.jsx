import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-contents">
        <span className="promo-badge">
          <span className="material-symbols-outlined">restaurant</span>
          Fresh & Fast Delivery
        </span>
        <h2>Order your favourite food here</h2>
        <p>
          Choose from a diverse menu featuring a delectable array of dishes crafted with the finest 
          ingredients and culinary expertise. Our mission is to satisfy your cravings and elevate 
          your dining experience, one delicious meal at a time.
        </p>
        <a href="#explore-menu" className="m3-btn m3-btn-filled view-menu-btn">
          Explore Menu
          <span className="material-symbols-outlined">arrow_forward</span>
        </a>
      </div>
    </header>
  );
};

export default Header;
