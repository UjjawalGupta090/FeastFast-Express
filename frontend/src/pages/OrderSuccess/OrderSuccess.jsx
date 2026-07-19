import React, { useEffect, useState } from "react";
import "./OrderSuccess.css";
import { useNavigate, useLocation } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(3);
  const [isFading, setIsFading] = useState(false);

  const orderDetails = location.state || {};

  useEffect(() => {
    // Countdown timer interval
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFading(true);
          setTimeout(() => {
            navigate("/myorders", { replace: true });
          }, 400); // 400ms fade-out transition
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className={`order-success-page ${isFading ? "fade-out" : ""}`}>
      <div className="order-success-card m3-card-elevated">
        {/* Animated Checkmark Circle */}
        <div className="success-icon-wrapper">
          <div className="success-icon-pulse"></div>
          <div className="success-icon-circle">
            <span className="material-symbols-outlined checkmark-icon">check_circle</span>
          </div>
        </div>

        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you for dining with <strong>Tomato</strong>. Your order has been dispatched to our kitchen!
        </p>

        {orderDetails.fulfillmentType && (
          <div className="order-info-chip">
            <span className="material-symbols-outlined chip-icon">
              {orderDetails.fulfillmentType === "dine-in" ? "table_restaurant" : "two_wheeler"}
            </span>
            <span>
              {orderDetails.fulfillmentType === "dine-in"
                ? `Dine-In Order`
                : `Delivery Order`}
            </span>
          </div>
        )}

        {/* Redirect notice and animated progress bar */}
        <div className="redirect-box">
          <p className="redirect-text">
            Redirecting to <strong>My Orders</strong> in <span className="timer-badge">{countdown}s</span>...
          </p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill"></div>
          </div>
        </div>

        {/* Instant action button */}
        <button
          className="m3-button m3-button-primary view-orders-btn"
          onClick={() => navigate("/myorders", { replace: true })}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          View My Orders Now
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
