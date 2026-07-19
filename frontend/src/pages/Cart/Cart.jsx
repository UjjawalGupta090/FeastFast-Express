import React, { useContext, useEffect } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getCartAmount, url, storeSettings, fulfillmentType, setFulfillmentType } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cartTotal = getCartAmount();
  const deliveryFee = (cartTotal > 0 && fulfillmentType === "delivery") ? 80 : 0;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <div className="cart-page">
      <h2 className="cart-title">Your Basket</h2>

      {cartTotal === 0 ? (
        <div className="empty-cart m3-card m3-card-outlined">
          <span className="material-symbols-outlined empty-cart-icon">shopping_cart</span>
          <h3>Your cart is empty</h3>
          <p>Go back to the menu to add delicious dishes to your basket!</p>
          <button className="m3-btn m3-btn-filled" onClick={() => navigate("/")}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items m3-card m3-card-outlined">
            <div className="cart-items-title cart-header">
              <p>Item</p>
              <p>Title</p>
              <p>Price</p>
              <p>Quantity</p>
              <p>Total</p>
              <p>Remove</p>
            </div>
            <hr className="cart-divider" />
            <div className="cart-items-list">
              {food_list.map((item) => {
                if (cartItems[item._id] > 0) {
                  const imageUrl = item.image.startsWith("http") ? item.image : `${url}/images/${item.image}`;
                  return (
                    <div key={item._id}>
                      <div className="cart-items-title cart-item-row">
                        <img src={imageUrl} alt={item.name} className="cart-item-img" />
                        <p className="cart-item-name">{item.name}</p>
                        <p>₹{item.price.toFixed(2)}</p>
                        <p className="cart-item-qty">{cartItems[item._id]}</p>
                        <p>₹{(item.price * cartItems[item._id]).toFixed(2)}</p>
                        <button 
                          className="cart-remove-btn" 
                          onClick={() => removeFromCart(item._id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      <hr className="cart-divider" />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Standing Highlighted Fulfillment Selector */}
          {storeSettings?.orderMode === "both" && (
            <div className="fulfillment-selection-card m3-card" style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              padding: "24px",
              marginBottom: "24px",
              backgroundColor: "var(--md-sys-color-primary-container)",
              color: "var(--md-sys-color-on-primary-container)",
              borderLeft: "6px solid var(--md-sys-color-primary)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  backgroundColor: "var(--md-sys-color-primary)",
                  color: "var(--md-sys-color-on-primary)",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>
                    {fulfillmentType === "delivery" ? "local_shipping" : "restaurant"}
                  </span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--md-sys-color-on-primary-container)" }}>
                    Fulfillment Selection Required
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.85, fontWeight: "500", color: "var(--md-sys-color-on-primary-container)" }}>
                    {fulfillmentType === "delivery" 
                      ? "Home Delivery: Enter your delivery address during checkout (₹80.00 Delivery Fee applies)." 
                      : "Dine-In / Pickup: Skip delivery address inputs and pay no delivery fees!"}
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                backgroundColor: "var(--md-sys-color-surface-container-highest)",
                padding: "4px",
                borderRadius: "100px",
                border: "1px solid var(--md-sys-color-outline-variant)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)"
              }}>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "10px 24px",
                    borderRadius: "100px",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    backgroundColor: fulfillmentType === "delivery" ? "var(--md-sys-color-primary)" : "transparent",
                    color: fulfillmentType === "delivery" ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface-variant)",
                    boxShadow: fulfillmentType === "delivery" ? "0 2px 6px rgba(0, 0, 0, 0.15)" : "none"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>local_shipping</span>
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("dine-in")}
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "10px 24px",
                    borderRadius: "100px",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    backgroundColor: fulfillmentType === "dine-in" ? "var(--md-sys-color-primary)" : "transparent",
                    color: fulfillmentType === "dine-in" ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface-variant)",
                    boxShadow: fulfillmentType === "dine-in" ? "0 2px 6px rgba(0, 0, 0, 0.15)" : "none"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>restaurant</span>
                  Dine-In
                </button>
              </div>
            </div>
          )}

          {storeSettings?.orderMode === "dine-in" && (
            <div className="fulfillment-selection-card m3-card" style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "16px",
              padding: "20px 24px",
              marginBottom: "24px",
              backgroundColor: "var(--md-sys-color-primary-container)",
              color: "var(--md-sys-color-on-primary-container)",
              borderLeft: "6px solid var(--md-sys-color-primary)",
              borderRadius: "12px"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>restaurant</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>Dine-In / Offline Ordering Only</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                  Notice: The restaurant is currently only accepting dine-in or pickup orders. Delivery is temporarily disabled, and all delivery fees are set to ₹0.
                </p>
              </div>
            </div>
          )}

          {storeSettings?.orderMode === "online" && (
            <div className="fulfillment-selection-card m3-card" style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "16px",
              padding: "20px 24px",
              marginBottom: "24px",
              backgroundColor: "var(--md-sys-color-primary-container)",
              color: "var(--md-sys-color-on-primary-container)",
              borderLeft: "6px solid var(--md-sys-color-primary)",
              borderRadius: "12px"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>local_shipping</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700" }}>Home Delivery Only</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                  Notice: The restaurant is currently only accepting home delivery orders. Dine-in or pickup orders are temporarily disabled.
                </p>
              </div>
            </div>
          )}

          <div className="cart-bottom">
            <div className="cart-total m3-card m3-card-elevated">
              <h3>Cart Totals</h3>
              <div className="total-details">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <hr className="detail-divider" />
                <div className="total-row">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <hr className="detail-divider" />
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              {storeSettings?.orderMode === "offline" && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "var(--md-sys-color-error-container)",
                  color: "var(--md-sys-color-on-error-container)",
                  borderRadius: "var(--md-shape-corner-medium)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  lineHeight: "1.4",
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>warning</span>
                  <span>We are currently offline and not accepting orders. Please check back later.</span>
                </div>
              )}
              {storeSettings?.orderMode === "dine-in" && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "var(--md-sys-color-tertiary-container)",
                  color: "var(--md-sys-color-on-tertiary-container)",
                  borderRadius: "var(--md-shape-corner-medium)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  lineHeight: "1.4",
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>info</span>
                  <span>Note: We are only accepting Dine-In orders. Delivery is temporarily disabled.</span>
                </div>
              )}
              <button 
                className="m3-btn m3-btn-filled checkout-btn" 
                onClick={() => navigate("/order")}
                disabled={storeSettings?.orderMode === "offline"}
                style={storeSettings?.orderMode === "offline" ? { opacity: 0.6, cursor: "not-allowed", marginTop: "16px" } : { marginTop: "16px" }}
              >
                {storeSettings?.orderMode === "offline" ? "Ordering Offline" : "Proceed To Checkout"}
                <span className="material-symbols-outlined">payments</span>
              </button>
            </div>

            <div className="cart-promocode m3-card m3-card-outlined">
              <p>If you have a promo code, enter it here</p>
              <div className="promocode-input-wrapper">
                <div className="m3-text-field promo-field">
                  <input type="text" placeholder=" " />
                  <label>Promo Code</label>
                </div>
                <button className="m3-btn m3-btn-tonal promo-apply-btn">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
