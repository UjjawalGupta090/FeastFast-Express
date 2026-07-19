import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import axios from "axios";

const Dashboard = ({ url, token }) => {
  const [settings, setSettings] = useState({
    salesTarget: 50000,
    activeDiscount: 0,
    promoCode: "",
    discountScope: "global",
    discountCategory: "",
    discountProduct: "",
    orderMode: "both"
  });

  const [targetInput, setTargetInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [scopeInput, setScopeInput] = useState("global");
  const [categoryInput, setCategoryInput] = useState("Salad");
  const [productInput, setProductInput] = useState("");
  const [acceptDelivery, setAcceptDelivery] = useState(true);
  const [acceptDineIn, setAcceptDineIn] = useState(true);
  const [foodList, setFoodList] = useState([]);

  const [deliveryRadiusInput, setDeliveryRadiusInput] = useState("5");

  // Daily Sales & Cash Log states
  const [todayOnlineSales, setTodayOnlineSales] = useState(0);
  const [todayCashSales, setTodayCashSales] = useState(0);
  const [todayStr, setTodayStr] = useState("");
  const [recentTracker, setRecentTracker] = useState([]);
  const [cashInput, setCashInput] = useState("");
  const [isCashFocused, setIsCashFocused] = useState(false);

  // Operational counts
  const [counts, setCounts] = useState({
    dishes: 0,
    categories: 0,
    customers: 0,
    orders: 0
  });

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const fetchData = async () => {
    try {
      const [settingsRes, foodRes, categoryRes, userRes, orderRes, trackerRes] = await Promise.all([
        axios.get(`${url}/api/settings`),
        axios.get(`${url}/api/food/list`),
        axios.get(`${url}/api/category/list`),
        axios.get(`${url}/api/user/list-users`, { headers: { token } }),
        axios.get(`${url}/api/order/list`, { headers: { token } }),
        axios.get(`${url}/api/order/daily-sales-tracker`, { headers: { token } })
      ]);

      if (settingsRes.data.success) {
        const settingsData = settingsRes.data.data;
        setSettings(settingsData);
        setTargetInput(settingsData.salesTarget.toString());
        setDiscountInput(settingsData.activeDiscount.toString());
        setPromoInput(settingsData.promoCode || "");
        setScopeInput(settingsData.discountScope || "global");
        setCategoryInput(settingsData.discountCategory || "Salad");
        setProductInput(settingsData.discountProduct || "");
        setDeliveryRadiusInput((settingsData.deliveryRadius || 5).toString());

        // Parse active orderMode toggles
        const mode = settingsData.orderMode || "both";
        setAcceptDelivery(mode === "both" || mode === "online");
        setAcceptDineIn(mode === "both" || mode === "dine-in");
      }

      if (foodRes.data.success) {
        const foods = foodRes.data.data || [];
        setFoodList(foods);
        if (foods.length > 0 && !productInput) {
          setProductInput(foods[0]._id);
        }
      }

      setCounts({
        dishes: foodRes.data.success ? (foodRes.data.data || []).length : 0,
        categories: categoryRes.data.success ? (categoryRes.data.data || []).length : 0,
        customers: userRes.data.success ? (userRes.data.data || []).length : 0,
        orders: orderRes.data.success ? (orderRes.data.data || []).length : 0
      });

      if (trackerRes.data.success) {
        setTodayOnlineSales(trackerRes.data.todayOnlineSales);
        setTodayCashSales(trackerRes.data.todayCashSales);
        setTodayStr(trackerRes.data.todayStr);
        setRecentTracker(trackerRes.data.recentTracker);
        setCashInput("");
      }

    } catch (error) {
      console.error("Error loading operational dataset:", error);
      setStatusMessage({ type: "error", text: "Failed to download operational configurations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, url]);

  useEffect(() => {
    const handleLiveRefresh = (e) => {
      console.log("Dashboard refreshing due to SSE event:", e.detail);
      if (token) {
        fetchData();
      }
    };
    window.addEventListener("live-refresh", handleLiveRefresh);
    return () => {
      window.removeEventListener("live-refresh", handleLiveRefresh);
    };
  }, [token, url]);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleUpdateSalesTarget = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/settings/update`, {
        salesTarget: Number(targetInput)
      }, { headers: { token } });

      if (response.data.success) {
        setSettings(response.data.data);
        setStatusMessage({ type: "success", text: "Sales target updated successfully!" });
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error saving sales target:", error);
      setStatusMessage({ type: "error", text: "Failed to save sales target." });
    }
  };

  const handleUpdatePromotions = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/settings/update`, {
        activeDiscount: Number(discountInput),
        promoCode: promoInput,
        discountScope: scopeInput,
        discountCategory: categoryInput,
        discountProduct: productInput
      }, { headers: { token } });

      if (response.data.success) {
        setSettings(response.data.data);
        setStatusMessage({ type: "success", text: "Promotions & discounts updated successfully!" });
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error saving promotions:", error);
      setStatusMessage({ type: "error", text: "Failed to save promotions." });
    }
  };

  const handleUpdateDeliveryRadius = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/settings/update`, {
        deliveryRadius: Number(deliveryRadiusInput)
      }, { headers: { token } });

      if (response.data.success) {
        setSettings(response.data.data);
        setStatusMessage({ type: "success", text: "Delivery radius updated successfully!" });
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error saving delivery radius:", error);
      setStatusMessage({ type: "error", text: "Failed to save delivery radius limit." });
    }
  };

  const handleLogCash = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    const finalCashAmount = cashInput === "" ? todayCashSales : Number(cashInput);
    try {
      const response = await axios.post(`${url}/api/order/log-cash`, {
        date: todayStr,
        cashAmount: finalCashAmount
      }, { headers: { token } });

      if (response.data.success) {
        setStatusMessage({ type: "success", text: "Daily cash logged successfully!" });
        setCashInput("");
        // Refresh tracker stats
        const trackerRes = await axios.get(`${url}/api/order/daily-sales-tracker`, { headers: { token } });
        if (trackerRes.data.success) {
          setTodayOnlineSales(trackerRes.data.todayOnlineSales);
          setTodayCashSales(trackerRes.data.todayCashSales);
          setRecentTracker(trackerRes.data.recentTracker);
        }
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error logging cash:", error);
      setStatusMessage({ type: "error", text: "Failed to log cash received." });
    }
  };

  const handleToggleFulfillment = async (type, isChecked) => {
    let nextDelivery = acceptDelivery;
    let nextDineIn = acceptDineIn;

    if (type === "delivery") {
      nextDelivery = isChecked;
      setAcceptDelivery(isChecked);
    } else if (type === "dine-in") {
      nextDineIn = isChecked;
      setAcceptDineIn(isChecked);
    }

    let computedMode = "both";
    if (nextDelivery && nextDineIn) {
      computedMode = "both";
    } else if (nextDelivery && !nextDineIn) {
      computedMode = "online";
    } else if (!nextDelivery && nextDineIn) {
      computedMode = "dine-in";
    } else {
      computedMode = "offline";
    }

    try {
      const response = await axios.post(`${url}/api/settings/update`, {
        salesTarget: Number(targetInput),
        activeDiscount: Number(discountInput),
        promoCode: promoInput,
        discountScope: scopeInput,
        discountCategory: categoryInput,
        discountProduct: productInput,
        orderMode: computedMode,
        deliveryRadius: Number(deliveryRadiusInput)
      }, { headers: { token } });

      if (response.data.success) {
        setSettings(response.data.data);
        setStatusMessage({ type: "success", text: `Operations configuration saved: ${computedMode.toUpperCase()}` });
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error updating operational mode:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to save operational settings changes."
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading operational configurations...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page-container">
      <h2 className="page-title">Operational Dashboard</h2>

      {statusMessage.text && (
        <div className={`status-banner m3-card-elevated ${statusMessage.type}`} style={{ marginBottom: "20px" }}>
          {statusMessage.text}
        </div>
      )}

      {/* Restaurant Operational Status Card */}
      <div className="m3-card m3-card-elevated" style={{
        padding: "20px 24px",
        marginBottom: "24px",
        background: (!acceptDelivery && !acceptDineIn)
          ? "linear-gradient(135deg, var(--md-sys-color-error-container) 0%, var(--md-sys-color-surface-container-high) 100%)"
          : "linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-surface-container-high) 100%)",
        borderLeft: `6px solid ${(!acceptDelivery && !acceptDineIn) ? "var(--md-sys-color-error)" : "var(--md-sys-color-primary)"}`,
        borderRadius: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            backgroundColor: (!acceptDelivery && !acceptDineIn) ? "var(--md-sys-color-error)" : "var(--md-sys-color-primary)",
            color: (!acceptDelivery && !acceptDineIn) ? "var(--md-sys-color-on-error)" : "var(--md-sys-color-on-primary)",
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.6rem" }}>
              {(!acceptDelivery && !acceptDineIn) ? "cloud_off" : "restaurant"}
            </span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "var(--md-sys-color-on-surface)" }}>
              Restaurant Operational Status: {(!acceptDelivery && !acceptDineIn) ? "OFFLINE" : "ONLINE"}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--md-sys-color-on-surface-variant)", fontWeight: "500" }}>
              {(!acceptDelivery && !acceptDineIn)
                ? "The store is currently marked offline. Customers cannot place orders."
                : `Active modes: ${acceptDelivery ? "Home Delivery" : ""} ${acceptDelivery && acceptDineIn ? "&" : ""} ${acceptDineIn ? "Dine-In" : ""}`}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              id="delivery-status-switch"
              checked={acceptDelivery}
              onChange={(e) => handleToggleFulfillment("delivery", e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--md-sys-color-primary)", cursor: "pointer" }}
            />
            <label htmlFor="delivery-status-switch" style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--md-sys-color-on-surface)", cursor: "pointer", userSelect: "none" }}>
              Home Delivery
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              id="dinein-status-switch"
              checked={acceptDineIn}
              onChange={(e) => handleToggleFulfillment("dine-in", e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--md-sys-color-primary)", cursor: "pointer" }}
            />
            <label htmlFor="dinein-status-switch" style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--md-sys-color-on-surface)", cursor: "pointer", userSelect: "none" }}>
              Dine-In / Offline
            </label>
          </div>
        </div>
      </div>

      {/* Operational Stats Grid Overview */}
      <div className="stats-cards-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card m3-card m3-card-outlined" style={{ borderLeft: "4px solid var(--md-sys-color-primary)" }}>
          <span className="material-symbols-outlined stat-card-icon" style={{ backgroundColor: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-primary)" }}>restaurant_menu</span>
          <div className="stat-card-info">
            <span className="stat-label">Active Dishes</span>
            <span className="stat-val">{counts.dishes} Items</span>
          </div>
        </div>

        <div className="stat-card m3-card m3-card-outlined" style={{ borderLeft: "4px solid var(--md-sys-color-secondary)" }}>
          <span className="material-symbols-outlined stat-card-icon" style={{ backgroundColor: "var(--md-sys-color-secondary-container)", color: "var(--md-sys-color-secondary)" }}>category</span>
          <div className="stat-card-info">
            <span className="stat-label">Menu Categories</span>
            <span className="stat-val">{counts.categories} Sections</span>
          </div>
        </div>

        <div className="stat-card m3-card m3-card-outlined" style={{ borderLeft: "4px solid var(--md-sys-color-tertiary)" }}>
          <span className="material-symbols-outlined stat-card-icon" style={{ backgroundColor: "var(--md-sys-color-tertiary-container)", color: "var(--md-sys-color-tertiary)" }}>group</span>
          <div className="stat-card-info">
            <span className="stat-label">Registered Accounts</span>
            <span className="stat-val">{counts.customers} Customers</span>
          </div>
        </div>

        <div className="stat-card m3-card m3-card-outlined" style={{ borderLeft: "4px solid var(--md-sys-color-error)" }}>
          <span className="material-symbols-outlined stat-card-icon" style={{ backgroundColor: "var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}>local_mall</span>
          <div className="stat-card-info">
            <span className="stat-label">Orders Handled</span>
            <span className="stat-val">{counts.orders} Total</span>
          </div>
        </div>
      </div>

      {/* Daily Income & Cash Tracker Card */}
      <div className="m3-card m3-card-outlined" style={{ padding: "20px", borderRadius: "12px", marginBottom: "24px", backgroundColor: "var(--md-sys-color-surface-container-low)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-primary)" }}>payments</span>
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "var(--md-sys-color-on-surface)" }}>
            Daily Income & Cash Tracker (Today: {todayStr})
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
          {/* Left panel: stats summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--md-sys-color-surface-container-high)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--md-sys-color-on-surface-variant)" }}>Today's Online Sales (Paid)</span>
              <strong style={{ fontSize: "1rem", color: "var(--md-sys-color-primary)" }}>₹{todayOnlineSales}</strong>
            </div>

            <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--md-sys-color-surface-container-high)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--md-sys-color-on-surface-variant)" }}>Today's Cash Received (Logged)</span>
              <strong style={{ fontSize: "1rem", color: "var(--md-sys-color-secondary)" }}>₹{todayCashSales}</strong>
            </div>

            <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--md-sys-color-primary-container)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--md-sys-color-on-primary-container)" }}>Total Today's Income</span>
              <strong style={{ fontSize: "1.15rem", color: "var(--md-sys-color-on-primary-container)" }}>₹{todayOnlineSales + todayCashSales}</strong>
            </div>
          </div>

          {/* Right panel: cash logger form */}
          <form onSubmit={handleLogCash} style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center" }}>
            <div className="m3-text-field" style={{ marginBottom: 0 }}>
              <input
                type="number"
                min="0"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder={todayCashSales.toString()}
                onFocus={() => setIsCashFocused(true)}
                onBlur={() => setIsCashFocused(false)}
              />
              <label style={{
                top: "-8px",
                left: "12px",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: isCashFocused ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface-variant)",
                backgroundColor: "var(--md-sys-color-surface)",
                padding: "0 6px",
                pointerEvents: "none",
                transition: "all .2s var(--md-transition-standard)"
              }}>
                Log Cash Received Today (₹)
              </label>
            </div>

            <button type="submit" className="m3-btn m3-btn-filled" style={{ height: "42px", borderRadius: "21px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>save</span>
              Log Cash Amount
            </button>
          </form>
        </div>

        {/* Recent logs history list */}
        {recentTracker && recentTracker.length > 0 && (
          <div style={{ marginTop: "16px", borderTop: "1px solid var(--md-sys-color-outline-variant)", paddingTop: "16px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "600", color: "var(--md-sys-color-on-surface-variant)" }}>
              Last 7 Days Income History
            </h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--md-sys-color-outline-variant)" }}>
                    <th style={{ padding: "8px", color: "var(--md-sys-color-on-surface-variant)" }}>Date</th>
                    <th style={{ padding: "8px", color: "var(--md-sys-color-on-surface-variant)", textAlign: "right" }}>Online Sales</th>
                    <th style={{ padding: "8px", color: "var(--md-sys-color-on-surface-variant)", textAlign: "right" }}>Cash Logged</th>
                    <th style={{ padding: "8px", color: "var(--md-sys-color-primary)", textAlign: "right" }}>Total Income</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTracker.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
                      <td style={{ padding: "8px", fontWeight: "500" }}>{log.displayDate} ({log.date})</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>₹{log.onlineSales}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>₹{log.cashSales}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontWeight: "700", color: "var(--md-sys-color-primary)" }}>₹{log.totalSales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Target Progress & Discount Settings controls */}
      <div className="dashboard-sections-grid" style={{ gridTemplateColumns: "1fr" }}>
        {/* Target and Controls Section */}
        {/* Target and Controls Section */}
        <div className="dashboard-settings-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ marginBottom: "8px" }}>
            <h3 className="section-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Operations Configuration Center</h3>
            <p className="section-description" style={{ margin: "4px 0 0 0" }}>Configure geofencing delivery limits, sales metrics, and active promotional campaigns.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Task Cluster 1: Sales Target Settings */}
            <form onSubmit={handleUpdateSalesTarget} className="m3-card m3-card-outlined" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-primary)" }}>trending_up</span>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "var(--md-sys-color-on-surface)" }}>
                  Sales Target Settings
                </h4>
              </div>
              
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div className="m3-text-field" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
                  <input
                    type="number"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>Monthly Revenue Target (₹)</label>
                </div>
                
                <button type="submit" className="m3-btn m3-btn-filled" style={{ height: "40px", borderRadius: "20px", padding: "0 24px" }}>
                  Save Sales Target
                </button>
              </div>
            </form>

            {/* Task Cluster 2: Delivery Geofencing Limit */}
            <form onSubmit={handleUpdateDeliveryRadius} className="m3-card m3-card-outlined" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-primary)" }}>storefront</span>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "var(--md-sys-color-on-surface)" }}>
                  Delivery Geofencing Limit
                </h4>
              </div>
              
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div className="m3-text-field" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={deliveryRadiusInput}
                    onChange={(e) => setDeliveryRadiusInput(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>Delivery Acceptance Radius (km)</label>
                </div>
                
                <button type="submit" className="m3-btn m3-btn-filled" style={{ height: "40px", borderRadius: "20px", padding: "0 24px" }}>
                  Save Delivery Radius
                </button>
              </div>

              {/* Coordinates Info */}
              <div className="m3-card m3-card-outlined" style={{ padding: "12px", borderRadius: "8px", border: "1px dashed var(--md-sys-color-outline-variant)", backgroundColor: "var(--md-sys-color-surface-container-high)", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--md-sys-color-on-surface-variant)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>info</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "500", lineHeight: "1.4", textAlign: "left" }}>
                    <strong>Restaurant Location:</strong> Geofencing coordinates (Latitude: {settings.restaurantLat || "28.071871"}, Longitude: {settings.restaurantLon || "80.096588"}) are securely configured.
                  </span>
                </div>
              </div>
            </form>

            {/* Task Cluster 3: Promotions & Discounts Card */}
            <form onSubmit={handleUpdatePromotions} className="m3-card m3-card-outlined" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "var(--md-sys-color-surface-container-low)", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--md-sys-color-secondary)" }}>percent</span>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "var(--md-sys-color-on-surface)" }}>
                  Promotions & Discount Manager
                </h4>
              </div>
              
              <div className="m3-select-wrapper" style={{ width: "100%", marginBottom: 0 }}>
                <select value={scopeInput} onChange={(e) => setScopeInput(e.target.value)}>
                  <option value="global">Global (All Products)</option>
                  <option value="category">Category Specific</option>
                  <option value="product">Product Specific</option>
                </select>
                <label>Discount Scope</label>
                <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
              </div>

              {scopeInput === "category" && (
                <div className="m3-select-wrapper" style={{ width: "100%", marginBottom: 0 }}>
                  <select value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)}>
                    <option value="Salad">Salad</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Sandwich">Sandwich</option>
                    <option value="Cake">Cake</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Noodles">Noodles</option>
                  </select>
                  <label>Select Category</label>
                  <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
                </div>
              )}

              {scopeInput === "product" && (
                <div className="m3-select-wrapper" style={{ width: "100%", marginBottom: 0 }}>
                  <select value={productInput} onChange={(e) => setProductInput(e.target.value)}>
                    {foodList.map((food) => (
                      <option key={food._id} value={food._id}>
                        {food.name} (₹{food.price})
                      </option>
                    ))}
                  </select>
                  <label>Select Product</label>
                  <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="m3-text-field" style={{ marginBottom: 0 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>
                    {scopeInput === "global" && "Global Discount (0-100%)"}
                    {scopeInput === "category" && `Category Discount (${categoryInput})`}
                    {scopeInput === "product" && "Selected Product Discount"}
                  </label>
                </div>

                <div className="m3-text-field" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder=" "
                  />
                  <label>Active Promo Code</label>
                </div>
              </div>

              <button type="submit" className="m3-btn m3-btn-filled submit-btn" style={{ width: "100%", height: "44px", borderRadius: "22px", justifyContent: "center", marginTop: "8px" }}>
                <span className="material-symbols-outlined">settings_backup_restore</span>
                Save Promotions & Discounts
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
