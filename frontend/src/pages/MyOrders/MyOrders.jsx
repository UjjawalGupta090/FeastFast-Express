import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState(null);

  const fetchOrders = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
      if (response.data.success) {
        const ordersList = response.data.data;
        setData(ordersList);
        // Re-sync active tracking details if the modal is open
        if (trackingOrder) {
          const updated = ordersList.find((o) => o._id === trackingOrder._id);
          if (updated) {
            setTrackingOrder(updated);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const cancelOrderHandler = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setData((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: "Cancelled" } : order
        )
      );

      const response = await axios.post(
        url + "/api/order/cancel",
        { orderId },
        { headers: { token } }
      );
      
      if (!response.data.success) {
        alert(response.data.message || "Failed to cancel order");
        fetchOrders(true);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.message || "Something went wrong while trying to cancel this order.");
      fetchOrders(true);
    }
  };

  const getStepClass = (stepName) => {
    if (!trackingOrder) return "pending";
    const currentStatus = trackingOrder.status;
    if (currentStatus === "Delivered") return "completed";
    
    const statusHierarchy = ["Placed", "Food Processing", "Prepared", "Out for Delivery", "Delivered"];
    const currentIdx = statusHierarchy.indexOf(currentStatus);
    const stepIdx = statusHierarchy.indexOf(stepName);

    if (stepIdx < currentIdx) {
      return "completed";
    } else if (stepIdx === currentIdx) {
      return "active";
    } else {
      return "pending";
    }
  };

  const getStepBadge = (stepClass) => {
    if (stepClass === "active") {
      return <span className="status-badge-timeline active-badge">Current Status</span>;
    }
    if (stepClass === "completed") {
      return <span className="status-badge-timeline completed-badge">Done</span>;
    }
    return null;
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  useEffect(() => {
    const handleLiveRefresh = (e) => {
      console.log("Customer Orders list refreshing due to SSE event:", e.detail);
      if (token) {
        fetchOrders(true); // Silent reload so it doesn't show loading spinner interruptions
      }
    };
    window.addEventListener("live-refresh", handleLiveRefresh);
    return () => {
      window.removeEventListener("live-refresh", handleLiveRefresh);
    };
  }, [token]);

  return (
    <div className="my-orders-page">
      <div className="my-orders-header">
        <h2>Track Your Orders</h2>
        <button className="m3-btn m3-btn-tonal refresh-btn" onClick={() => fetchOrders(true)} disabled={loading}>
          <span className="material-symbols-outlined">track_changes</span>
          Refresh
        </button>
      </div>

      {!token ? (
        <div className="my-orders-error m3-card m3-card-outlined">
          <span className="material-symbols-outlined error-icon">login</span>
          <h3>Please sign in to track orders</h3>
        </div>
      ) : loading ? (
        <div className="my-orders-loading">
          <div className="m3-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="my-orders-empty m3-card m3-card-outlined">
          <span className="material-symbols-outlined empty-icon">delivery_dining</span>
          <h3>No orders placed yet</h3>
          <p>Once you purchase items from our catalog, you can track their status here.</p>
        </div>
      ) : (
        <div className="my-orders-list">
          {data.map((order, index) => {
            const itemsString = order.items
              .map((item) => `${item.name} x ${item.quantity}`)
              .join(", ");

            const statusClass = order.status.replace(/\s+/g, "-").toLowerCase();

            return (
              <div key={order._id || index} className="order-card m3-card m3-card-outlined">
                <span className="material-symbols-outlined order-box-icon">delivery_dining</span>
                
                <div className="order-details">
                  <p className="order-items-text">{itemsString}</p>
                  <div className="order-meta">
                    <span className="order-date">Date: {new Date(order.date).toLocaleDateString()}</span>
                    <span className="order-amount">Amount: <strong>₹{order.amount.toFixed(2)}</strong></span>
                    <span className="order-qty">Items: {order.items.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
                  </div>
                  {order.notes && (
                    <p style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.8rem",
                      color: "var(--md-sys-color-on-surface-variant)",
                      fontStyle: "italic",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.05rem" }}>edit_note</span>
                      <span>Request: "{order.notes}"</span>
                    </p>
                  )}
                </div>

                <div className="order-status-wrapper">
                  <span className={`status-dot ${statusClass}`}></span>
                  <span className="status-text">{order.status}</span>
                </div>

                <div className="order-actions-wrapper" style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  minWidth: "120px"
                }}>
                  {order.status === "Placed" && (
                    <button
                      className="m3-btn m3-btn-outlined cancel-btn"
                      onClick={() => cancelOrderHandler(order._id)}
                      style={{
                        borderColor: "var(--md-sys-color-error)",
                        color: "var(--md-sys-color-error)",
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        height: "40px"
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.status !== "Placed" && order.status !== "Cancelled" && order.status !== "Rejected" && (
                    <button 
                      className="m3-btn m3-btn-filled track-btn" 
                      onClick={() => setTrackingOrder(order)} 
                      style={{ height: "40px" }}
                    >
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Tracking Modal */}
      {trackingOrder && (
        <div className="tracking-modal-overlay" onClick={() => setTrackingOrder(null)}>
          <div className="tracking-modal-card m3-card" onClick={(e) => e.stopPropagation()}>
            <div className="tracking-modal-header">
              <h3>Live Status Tracker</h3>
              <button className="close-modal-btn" onClick={() => setTrackingOrder(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="tracking-order-meta">
              <p style={{ margin: 0 }}>Order ID: <span>#{trackingOrder._id.substring(trackingOrder._id.length - 8).toUpperCase()}</span></p>
              <p style={{ margin: 0 }}>Date: <span>{new Date(trackingOrder.date).toLocaleDateString()}</span></p>
            </div>

            <div className="tracking-items-summary">
              <h4>Items Summary</h4>
              <div className="tracking-items-list">
                {trackingOrder.items.map((item, idx) => (
                  <div key={idx} className="tracking-item-row">
                    <span className="item-qty-name">{item.name} x {item.quantity}</span>
                    <span className="item-subtotal">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--md-sys-color-outline-variant)", margin: "12px 0" }} />
              <div className="tracking-total-row">
                <span style={{ fontWeight: 600 }}>Total Amount:</span>
                <strong>₹{trackingOrder.amount.toFixed(2)}</strong>
              </div>
            </div>

            {/* Rejection / Cancellation note */}
            {(trackingOrder.status === "Rejected" || trackingOrder.status === "Cancelled") && (
              <div className="rejection-banner-container" style={{
                backgroundColor: trackingOrder.status === "Rejected" ? "var(--md-sys-color-error-container)" : "var(--md-sys-color-surface-container-high)",
                color: trackingOrder.status === "Rejected" ? "var(--md-sys-color-on-error-container)" : "var(--md-sys-color-on-surface-variant)",
                padding: "16px",
                borderRadius: "12px",
                marginTop: "4px",
                borderLeft: `5px solid ${trackingOrder.status === "Rejected" ? "var(--md-sys-color-error)" : "var(--md-sys-color-outline)"}`,
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                  <span className="material-symbols-outlined">
                    {trackingOrder.status === "Rejected" ? "warning" : "info"}
                  </span>
                  <span>Order {trackingOrder.status}</span>
                </div>
                {trackingOrder.adminNote && (
                  <p style={{ fontSize: "0.85rem", fontStyle: "italic", margin: 0 }}>
                    Restaurant Note: "{trackingOrder.adminNote}"
                  </p>
                )}
              </div>
            )}

            {/* Live timeline status */}
            {trackingOrder.status !== "Rejected" && trackingOrder.status !== "Cancelled" && (
              <div className="tracking-timeline-container" style={{ marginTop: "16px" }}>
                <h4 style={{ marginBottom: "16px", fontSize: "0.95rem", fontWeight: "700" }}>Preparation Status</h4>
                <div className="tracking-timeline-vertical">
                  {/* Step 1: Placed */}
                  <div className={`timeline-step ${getStepClass("Placed")}`}>
                    <div className="timeline-node">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div className="timeline-content">
                      <h5>
                        <span>Placed</span>
                        {getStepBadge(getStepClass("Placed"))}
                      </h5>
                      <p>Order received by the restaurant.</p>
                    </div>
                  </div>

                  {/* Step 2: Preparing */}
                  <div className={`timeline-step ${getStepClass("Food Processing")}`}>
                    <div className="timeline-node">
                      <span className="material-symbols-outlined">restaurant</span>
                    </div>
                    <div className="timeline-content">
                      <h5>
                        <span>Preparing</span>
                        {getStepBadge(getStepClass("Food Processing"))}
                      </h5>
                      <p>Chef is preparing your fresh meal.</p>
                    </div>
                  </div>

                  {/* Step 3: Prepared */}
                  <div className={`timeline-step ${getStepClass("Prepared")}`}>
                    <div className="timeline-node">
                      <span className="material-symbols-outlined">flatware</span>
                    </div>
                    <div className="timeline-content">
                      <h5>
                        <span>Prepared</span>
                        {getStepBadge(getStepClass("Prepared"))}
                      </h5>
                      <p>Your order is ready for dispatch/pickup.</p>
                    </div>
                  </div>

                  {/* Step 4: Out for Delivery */}
                  <div className={`timeline-step ${getStepClass("Out for Delivery")}`}>
                    <div className="timeline-node">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div className="timeline-content">
                      <h5>
                        <span>Out for Delivery</span>
                        {getStepBadge(getStepClass("Out for Delivery"))}
                      </h5>
                      <p>Our rider is carrying your hot meal.</p>
                    </div>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className={`timeline-step ${getStepClass("Delivered")}`}>
                    <div className="timeline-node">
                      <span className="material-symbols-outlined">home</span>
                    </div>
                    <div className="timeline-content">
                      <h5>
                        <span>Delivered</span>
                        {getStepBadge(getStepClass("Delivered"))}
                      </h5>
                      <p>Meal delivered. Enjoy your food!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
