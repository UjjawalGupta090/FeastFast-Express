import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";

const Orders = ({ url, token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleAcceptOrder = async (orderId) => {
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: "Food Processing"
      }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: "Order Accepted! Moved to Food Processing." });
        await fetchAllOrders();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      setStatusMessage({ type: "error", text: "Failed to accept order." });
    }
  };

  const handleRejectOrderSubmit = async (orderId) => {
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: "Rejected",
        adminNote: rejectionNote.trim()
      }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: "Order Rejected successfully." });
        setRejectingOrderId(null);
        setRejectionNote("");
        await fetchAllOrders();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      setStatusMessage({ type: "error", text: "Failed to reject order." });
    }
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/order/list`, {
        headers: { token }
      });
      if (response.data.success) {
        const orderData = response.data.data;
        setOrders(orderData);
        if (selectedOrder) {
          const updated = orderData.find((o) => o._id === selectedOrder._id);
          if (updated) {
            setSelectedOrder(updated);
          }
        }
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Failed to load orders" });
      }
    } catch (error) {
      console.error("Error loading admin orders:", error);
      setStatusMessage({ type: "error", text: "Offline or unable to connect to the backend server." });
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (event, orderId, directStatus = null) => {
    const newStatus = directStatus || event.target.value;
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: newStatus
      }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: "Order status updated successfully!" });
        await fetchAllOrders();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusMessage({ type: "error", text: "Failed to update order status." });
    }
  };

  // Kitchen Order Ticket print flow (80mm thermal print receipt)
  const printKOT = (order) => {
    const { firstName, lastName, phone, street, city, state, country, zipcode, type } = order.address;
    const itemsHTML = order.items
      .map((item) => `
        <tr>
          <td style="padding: 6px 0; font-size: 14px; font-weight: bold; border-bottom: 1px dotted #ccc;">${item.name}</td>
          <td style="padding: 6px 0; text-align: right; font-size: 14px; font-weight: bold; border-bottom: 1px dotted #ccc;">x ${item.quantity}</td>
        </tr>
      `)
      .join("");

    const receiptWindow = window.open("", "_blank", "width=600,height=600");
    receiptWindow.document.write(`
      <html>
        <head>
          <title>KOT - Order #${order._id.substring(order._id.length - 6)}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 74mm;
              margin: 0 auto;
              padding: 10px;
              color: #000;
              background-color: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 16px;
              font-weight: 800;
              margin: 0 0 4px 0;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 4px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              margin-top: 12px;
              padding-top: 6px;
              border-top: 2px dashed #000;
            }
            .customer-details {
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">KITCHEN ORDER TICKET</h1>
            <div style="font-size: 11px; font-weight: bold;">TOMATO RESTAURANT</div>
          </div>
          
          <div class="meta-row">
            <span><strong>Order:</strong> #${order._id.substring(order._id.length - 6)}</span>
            <span><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</span>
          </div>
          <div class="meta-row">
            <span><strong>Time:</strong> ${new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span><strong>Status:</strong> ${order.status}</span>
          </div>
          <div class="customer-details" style="font-size: 12px; line-height: 1.4; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
            <div><strong>Customer:</strong> ${firstName} ${lastName}</div>
            <div><strong>Phone:</strong> ${phone}</div>
            ${type !== "dine-in" ? `<div style="margin-top: 2px;"><strong>Address:</strong> ${street}, ${city}${state ? `, ${state}` : ""}${country ? `, ${country}` : ""}${zipcode ? ` - ${zipcode}` : ""}</div>` : `<div><strong>Fulfillment:</strong> Dine-In / Pickup</div>`}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #000;">DISH DESCRIPTION</th>
                <th style="text-align: right; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #000;">QTY</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          ${order.notes ? `
          <div style="margin-top: 10px; padding: 6px; border: 1px dashed #000; font-size: 11px; font-weight: bold; background-color: #eee;">
            *** COOKING INSTRUCTIONS ***<br/>
            "${order.notes}"
          </div>
          ` : ""}

          <div class="footer">
            *** COOKING STAFF COPY ***
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    const handleLiveRefresh = (e) => {
      console.log("Admin Orders list refreshing due to SSE event:", e.detail);
      fetchAllOrders();
    };
    window.addEventListener("live-refresh", handleLiveRefresh);
    return () => {
      window.removeEventListener("live-refresh", handleLiveRefresh);
    };
  }, []);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  return (
    <div className="orders-page dashboard-page-container">
      <div className="orders-page-header">
        <h2 className="page-title">Orders Management</h2>
        <button className="m3-btn m3-btn-tonal refresh-btn" onClick={fetchAllOrders} disabled={loading}>
          <span className="material-symbols-outlined">track_changes</span>
          Refresh List
        </button>
      </div>

      {statusMessage.text && (
        <div className={`status-banner m3-card-elevated ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Live Info Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "20px",
        width: "100%"
      }}>
        <div className="m3-card m3-card-outlined" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--md-sys-color-primary)", backgroundColor: "var(--md-sys-color-primary-container)", padding: "8px", borderRadius: "8px" }}>inbox</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--md-sys-color-on-surface-variant)", fontWeight: 600 }}>Total Orders</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--md-sys-color-on-surface)" }}>{orders.length}</strong>
          </div>
        </div>

        <div className="m3-card m3-card-outlined" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--md-sys-color-error)", backgroundColor: "var(--md-sys-color-error-container)", padding: "8px", borderRadius: "8px" }}>pending_actions</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--md-sys-color-on-surface-variant)", fontWeight: 600 }}>Needs Acceptance</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--md-sys-color-error)" }}>{orders.filter(o => o.status === "Placed").length}</strong>
          </div>
        </div>

        <div className="m3-card m3-card-outlined" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--md-sys-color-secondary)", backgroundColor: "var(--md-sys-color-secondary-container)", padding: "8px", borderRadius: "8px" }}>soup_kitchen</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--md-sys-color-on-surface-variant)", fontWeight: 600 }}>Preparing Food</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--md-sys-color-on-surface)" }}>{orders.filter(o => o.status === "Food Processing").length}</strong>
          </div>
        </div>

        <div className="m3-card m3-card-outlined" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "2rem", color: "var(--md-sys-color-tertiary)", backgroundColor: "var(--md-sys-color-tertiary-container)", padding: "8px", borderRadius: "8px" }}>local_shipping</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--md-sys-color-on-surface-variant)", fontWeight: 600 }}>Out for Delivery</span>
            <strong style={{ fontSize: "1.25rem", color: "var(--md-sys-color-on-surface)" }}>{orders.filter(o => o.status === "Out for Delivery").length}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="orders-loading">
          <div className="m3-spinner"></div>
          <p>Loading incoming orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty m3-card m3-card-outlined">
          <span className="material-symbols-outlined empty-icon">delivery_dining</span>
          <h3>No orders available</h3>
          <p>When clients place orders on the frontend storefront, they will be listed here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, index) => {
            const { firstName, lastName, street, city, state, country, zipcode, phone } = order.address;
            const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
            
            return (
              <div key={order._id || index} className="admin-order-card clickable-card m3-card m3-card-outlined" onClick={() => setSelectedOrder(order)}>
                <span className="material-symbols-outlined order-icon">delivery_dining</span>
                
                <div className="order-items-column">
                  <p className="order-items-title">
                    {order.items.map((item, idx) => (
                      <span key={idx}>
                        {item.name} x {item.quantity}
                        {idx < order.items.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                  <div className="order-address-box">
                    <p className="customer-name">
                      {firstName} {lastName}
                      {order.address.type === "dine-in" && (
                        <span className="dine-in-badge" style={{
                          marginLeft: "8px",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          backgroundColor: "var(--md-sys-color-tertiary-container)",
                          color: "var(--md-sys-color-on-tertiary-container)",
                          padding: "2px 8px",
                          borderRadius: "8px",
                          textTransform: "uppercase"
                        }}>Dine-In</span>
                      )}
                    </p>
                    {order.address.type === "dine-in" ? (
                      <p style={{ fontStyle: "italic", color: "var(--md-sys-color-tertiary)" }}>
                        Dine-In / Pickup Order (No Address)
                      </p>
                    ) : (
                      <>
                        <p>{street}</p>
                        <p>{city}{state ? `, ${state}` : ""}{country ? `, ${country}` : ""}{zipcode ? ` - ${zipcode}` : ""}</p>
                      </>
                    )}
                    <p className="phone-number">
                      <span className="material-symbols-outlined phone-icon">call</span>
                      {phone}
                    </p>
                  </div>
                  {order.notes && (
                    <div className="order-notes-box" style={{
                      marginTop: "10px",
                      padding: "8px 12px",
                      backgroundColor: "var(--md-sys-color-error-container)",
                      color: "var(--md-sys-color-on-error-container)",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>edit_note</span>
                      <span>Request: "{order.notes}"</span>
                    </div>
                  )}
                </div>

                <div className="order-stats-column">
                  <p className="stat-item">Items: <strong>{totalItems}</strong></p>
                  <p className="stat-item price-stat">Amount: <strong>₹{order.amount.toFixed(2)}</strong></p>
                  <span className={`payment-tag ${order.payment ? "paid" : "unpaid"}`}>
                    {order.payment ? "Stripe Verified" : "Pending Payment"}
                  </span>
                </div>

                {/* Combined operations column */}
                <div className="order-actions-column" style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "180px" }}>
                  {order.status === "Placed" ? (
                    <div className="accept-reject-actions" style={{ display: "flex", flexDirection: "column", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                      {rejectingOrderId === order._id ? (
                        <div className="reject-form" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div className="m3-text-field" style={{ margin: 0 }}>
                            <input 
                              type="text" 
                              value={rejectionNote}
                              onChange={(e) => setRejectionNote(e.target.value)}
                              placeholder=" "
                            />
                            <label>Reason (Optional)</label>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button 
                              type="button" 
                              className="m3-btn m3-btn-filled"
                              onClick={(e) => { e.stopPropagation(); handleRejectOrderSubmit(order._id); }}
                              style={{ flex: 1, height: "36px", fontSize: "0.75rem", backgroundColor: "var(--md-sys-color-error)", color: "var(--md-sys-color-on-error)", padding: "0 8px" }}
                            >
                              Confirm
                            </button>
                            <button 
                              type="button" 
                              className="m3-btn m3-btn-text" 
                              onClick={(e) => { e.stopPropagation(); setRejectingOrderId(null); setRejectionNote(""); }}
                              style={{ flex: 0.5, height: "36px", fontSize: "0.75rem", padding: "0 4px" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            type="button" 
                            className="m3-btn m3-btn-filled accept-order-btn"
                            onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order._id); }}
                            style={{ 
                              height: "40px", 
                              backgroundColor: "var(--md-sys-color-tertiary)", 
                              color: "var(--md-sys-color-on-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              fontSize: "0.8rem",
                              width: "100%"
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>check</span>
                            Accept Order
                          </button>
                          <button 
                            type="button" 
                            className="m3-btn m3-btn-tonal reject-order-btn"
                            onClick={(e) => { e.stopPropagation(); setRejectingOrderId(order._id); }}
                            style={{ 
                              height: "40px", 
                              color: "var(--md-sys-color-error)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              fontSize: "0.8rem",
                              width: "100%"
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
                            Reject Order
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    ["Delivered", "Cancelled", "Rejected"].includes(order.status) ? (
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        textAlign: "center",
                        backgroundColor: order.status === "Delivered" ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-error-container)",
                        color: order.status === "Delivered" ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-error-container)",
                        width: "100%"
                      }}>
                        Status: {order.status}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <div className="m3-select-wrapper status-updater" style={{ width: "100%", marginBottom: 0 }} onClick={(e) => e.stopPropagation()}>
                          <select 
                            value={order.status} 
                            onChange={(e) => { e.stopPropagation(); statusHandler(e, order._id); }}
                          >
                            <option value="Food Processing">Food Processing</option>
                            <option value="Prepared">Prepared</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <label>Order Status</label>
                          <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
                        </div>
                        
                        <button
                          type="button"
                          className="m3-btn m3-btn-outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to cancel this order?")) {
                              statusHandler(null, order._id, "Cancelled");
                            }
                          }}
                          style={{
                            height: "36px",
                            borderColor: "var(--md-sys-color-error)",
                            color: "var(--md-sys-color-error)",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            width: "100%"
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>cancel</span>
                          Cancel Order
                        </button>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    className="m3-btn m3-btn-tonal print-kot-btn"
                    onClick={(e) => { e.stopPropagation(); printKOT(order); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      height: "40px",
                      fontSize: "0.8rem"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>print</span>
                    Print KOT Ticket
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Preview Drawer */}
      {selectedOrder && (
        <div className="order-preview-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-preview-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="order-preview-header">
              <h3>Order Details Preview</h3>
              <button className="close-preview-btn" onClick={() => setSelectedOrder(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="order-preview-body">
              {/* Order Meta details */}
              <div className="preview-section">
                <h4>Order Summary</h4>
                <div className="preview-meta-grid">
                  <div className="meta-field">
                    <label>Order ID</label>
                    <span style={{ fontSize: "0.8rem" }}>#{selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}</span>
                  </div>
                  <div className="meta-field">
                    <label>Status</label>
                    <span style={{ 
                      color: selectedOrder.status === "Delivered" ? "var(--md-sys-color-tertiary)" :
                             selectedOrder.status === "Rejected" ? "var(--md-sys-color-error)" :
                             selectedOrder.status === "Placed" ? "#d97706" : "var(--md-sys-color-primary)",
                      fontWeight: "700"
                    }}>{selectedOrder.status}</span>
                  </div>
                  <div className="meta-field">
                    <label>Date & Time</label>
                    <span>{new Date(selectedOrder.date).toLocaleString()}</span>
                  </div>
                  <div className="meta-field">
                    <label>Payment Status</label>
                    <span style={{ color: selectedOrder.payment ? "var(--md-sys-color-tertiary)" : "var(--md-sys-color-error)", fontWeight: "700" }}>
                      {selectedOrder.payment ? "Stripe Verified" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="preview-section">
                <h4>Customer & Delivery</h4>
                <div className="preview-meta-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="meta-field">
                    <label>Customer Name</label>
                    <span>{selectedOrder.address.firstName} {selectedOrder.address.lastName}</span>
                  </div>
                  <div className="meta-field">
                    <label>{selectedOrder.address.type === "dine-in" ? "Fulfillment Mode" : "Delivery Address"}</label>
                    <span>
                      {selectedOrder.address.type === "dine-in" 
                        ? "Dine-In / Pickup (No Delivery Address Required)" 
                        : `${selectedOrder.address.street}, ${selectedOrder.address.city}${selectedOrder.address.state ? `, ${selectedOrder.address.state}` : ""}${selectedOrder.address.country ? `, ${selectedOrder.address.country}` : ""}${selectedOrder.address.zipcode ? ` - ${selectedOrder.address.zipcode}` : ""}`}
                    </span>
                  </div>
                  <div className="meta-field">
                    <label>Phone Number</label>
                    <span>{selectedOrder.address.phone}</span>
                  </div>
                </div>
              </div>

              {/* Rejection / Cancellation note */}
              {selectedOrder.adminNote && (
                <div className="preview-notes-box" style={{ backgroundColor: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface)" }}>
                  <span className="material-symbols-outlined">info</span>
                  <div>
                    <span style={{ fontWeight: 700, display: "block" }}>Restaurant Action Note</span>
                    <span style={{ fontSize: "0.8rem", fontStyle: "italic" }}>"{selectedOrder.adminNote}"</span>
                  </div>
                </div>
              )}

              {/* Special Customer Requests */}
              {selectedOrder.notes && (
                <div className="preview-notes-box">
                  <span className="material-symbols-outlined">edit_note</span>
                  <div>
                    <span style={{ fontWeight: 700, display: "block" }}>Customer Special Request</span>
                    <span style={{ fontSize: "0.8rem" }}>"{selectedOrder.notes}"</span>
                  </div>
                </div>
              )}

              {/* Itemized Table list */}
              <div className="preview-section">
                <h4>Items Ordered</h4>
                <div className="preview-summary-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="preview-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="preview-item-info">
                              <img 
                                src={item.image.startsWith("http") ? item.image : `${url}/images/${item.image}`} 
                                alt={item.name} 
                                className="preview-item-img" 
                              />
                              <span className="preview-item-name">{item.name}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>x {item.quantity}</td>
                          <td style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: "16px", backgroundColor: "var(--md-sys-color-surface-container-low)" }}>
                    <div className="summary-row total">
                      <span>Total Amount:</span>
                      <strong>₹{selectedOrder.amount.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action controls inside the modal */}
              <div className="preview-section" style={{ marginTop: "12px" }}>
                <h4>Actions</h4>
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <button
                    type="button"
                    className="m3-btn m3-btn-tonal"
                    onClick={() => printKOT(selectedOrder)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "48px" }}
                  >
                    <span className="material-symbols-outlined">print</span>
                    Print KOT
                  </button>
                  {selectedOrder.status === "Placed" ? (
                    <div style={{ display: "flex", gap: "8px", flex: 2 }}>
                      <button
                        type="button"
                        className="m3-btn m3-btn-filled"
                        onClick={() => {
                          handleAcceptOrder(selectedOrder._id);
                          setSelectedOrder(null);
                        }}
                        style={{ flex: 1, backgroundColor: "var(--md-sys-color-tertiary)", color: "var(--md-sys-color-on-tertiary)", height: "48px" }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="m3-btn m3-btn-tonal"
                        onClick={() => {
                          setRejectingOrderId(selectedOrder._id);
                          setSelectedOrder(null);
                        }}
                        style={{ flex: 1, color: "var(--md-sys-color-error)", height: "48px" }}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    ["Delivered", "Cancelled", "Rejected"].includes(selectedOrder.status) ? (
                      <div style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        textAlign: "center",
                        backgroundColor: selectedOrder.status === "Delivered" ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-error-container)",
                        color: selectedOrder.status === "Delivered" ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-error-container)",
                        flex: 2
                      }}>
                        Status: {selectedOrder.status}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", flex: 2.2, alignItems: "center" }}>
                        <div className="m3-select-wrapper status-updater" style={{ flex: 1.2, marginBottom: 0 }}>
                          <select 
                            value={selectedOrder.status} 
                            onChange={(e) => {
                              statusHandler(e, selectedOrder._id);
                              setSelectedOrder(prev => ({ ...prev, status: e.target.value }));
                            }}
                            style={{ paddingRight: "36px" }}
                          >
                            <option value="Food Processing">Food Processing</option>
                            <option value="Prepared">Prepared</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <label>Order Status</label>
                          <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
                        </div>
                        
                        <button
                          type="button"
                          className="m3-btn m3-btn-outlined"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to cancel this order?")) {
                              statusHandler(null, selectedOrder._id, "Cancelled");
                              setSelectedOrder(null);
                            }
                          }}
                          style={{
                            height: "48px",
                            flex: 1,
                            borderColor: "var(--md-sys-color-error)",
                            color: "var(--md-sys-color-error)",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>cancel</span>
                          Cancel Order
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
