import React, { useContext } from "react";
import "./ExploreMenu.css";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { categories, url } = useContext(StoreContext);

  return (
    <section className="explore-menu" id="explore-menu">
      <h2>Explore our menu</h2>
      <p className="explore-menu-text">
        Choose from a diverse menu featuring a delectable array of dishes. Our mission is to 
        satisfy your cravings and elevate your dining experience, one delicious meal at a time.
      </p>
      
      <div className="explore-menu-list">
        {categories.map((item, index) => {
          const isActive = category === item.name;
          const isSeeded = item.image?.startsWith("http");
          const imageUrl = isSeeded ? item.image : `${url}/images/${item.image}`;

          return (
            <div 
              key={item._id || index} 
              className={`explore-menu-list-item ${isActive ? "active" : ""}`}
              onClick={() => setCategory(prev => prev === item.name ? "All" : item.name)}
            >
              {item.image ? (
                <img src={imageUrl} alt={item.name} />
              ) : (
                <div className="explore-menu-placeholder" style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "var(--md-sys-color-surface-container-high)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--md-sys-color-outline)",
                  border: "4px solid transparent",
                  transition: "all 0.2s"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>restaurant</span>
                </div>
              )}
              <p>{item.name}</p>
            </div>
          );
        })}
      </div>
      <hr />
    </section>
  );
};

export default ExploreMenu;
