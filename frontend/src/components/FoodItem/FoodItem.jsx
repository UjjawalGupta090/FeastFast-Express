import React, { useContext } from "react";
import "./FoodItem.css";
import { StoreContext } from "../../context/StoreContext";

const FoodItem = ({ id, name, price, description, image, dietType, inStock = true, category }) => {
  const { cartItems, addToCart, removeFromCart, url, getProductDiscount } = useContext(StoreContext);

  const activeDiscount = getProductDiscount({ _id: id, category });

  // Parse image URL: if it's a seed image URL, use it directly. Otherwise, load from backend uploads folder.
  const imageUrl = image.startsWith("http") ? image : `${url}/images/${image}`;

  // Check count in cart
  const itemCount = cartItems[id] || 0;

  return (
    <article className={`food-item m3-card m3-card-outlined ${!inStock ? "out-of-stock-item" : ""}`}>
      <div className="food-item-img-container">
        <img className="food-item-image" src={imageUrl} alt={name} loading="lazy" />
        
        {!inStock ? (
          <div className="out-of-stock-overlay">
            <span>Sold Out</span>
          </div>
        ) : itemCount === 0 ? (
          <button 
            className="add-fab m3-fab" 
            onClick={() => addToCart(id)} 
            aria-label={`Add ${name} to cart`}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        ) : (
          <div className="food-item-counter m3-card-elevated">
            <button className="counter-btn minus" onClick={() => removeFromCart(id)}>
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="counter-value">{itemCount}</span>
            <button className="counter-btn plus" onClick={() => addToCart(id)}>
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Indian standard Veg / Non-Veg square dot badge */}
            <div style={{
              width: "16px",
              height: "16px",
              border: `2px solid ${dietType === "Veg" ? "#2e6a4f" : "#ba1a1a"}`,
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }} title={dietType}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: dietType === "Veg" ? "#2e6a4f" : "#ba1a1a"
              }}></div>
            </div>
            <h3>{name}</h3>
          </div>
          <div className="rating-stars">
            <span className="material-symbols-outlined rating-star-icon">star</span>
            <span className="rating-text">4.5</span>
          </div>
        </div>
        <p className="food-item-desc">{description}</p>
        <div className="food-item-footer">
          {activeDiscount > 0 ? (
            <div className="price-display-discounted" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="food-item-price">₹{Math.round(price * (100 - activeDiscount) / 100).toFixed(2)}</span>
              <span className="food-item-price-original" style={{ textDecoration: "line-through", color: "var(--md-sys-color-outline)", fontSize: "0.8rem" }}>₹{price.toFixed(2)}</span>
              <span className="discount-badge" style={{ color: "#fff", backgroundColor: "var(--md-sys-color-primary)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.65rem", fontWeight: "700", whiteSpace: "nowrap" }}>{activeDiscount}% OFF</span>
            </div>
          ) : (
            <span className="food-item-price">₹{price.toFixed(2)}</span>
          )}
          <span className="food-item-category-tag">Fresh</span>
        </div>
      </div>
    </article>
  );
};

export default FoodItem;
