import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/Dashboard.css"; // Reuse same layout tokens
import "./Analytics.css";

const Analytics = ({ url, token }) => {
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState("none"); // none, pending, approved, rejected
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  
  const [stats, setStats] = useState({
    totalSales: 0,
    weeklySales: 0,
    monthlySales: 0,
    quarterlySales: 0,
    yearlySales: 0,
    topItems: [],
    dailySales: [],
    calendarSales: {}
  });

  const [settings, setSettings] = useState({ salesTarget: 50000 });
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Calendar dates
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch access details
  const fetchAccessDetails = async () => {
    try {
      const response = await axios.post(`${url}/api/user/status`, {}, {
        headers: { token }
      });
      if (response.data.success) {
        setAccessStatus(response.data.analyticalAccess || "none");
        if (response.data.analyticalAccess === "approved") {
          fetchAnalyticsData();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking analytical access status:", error);
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsResponse = await axios.get(`${url}/api/order/dashboard-stats`, {
        headers: { token }
      });
      // Fetch settings
      const settingsResponse = await axios.get(`${url}/api/settings`);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      if (settingsResponse.data.success) {
        setSettings(settingsResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching analytical statistics:", error);
      setStatusMessage({ type: "error", text: "Failed to download financial records." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAccessDetails();
    }
  }, [token, url]);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Request Access handler
  const handleRequestAccess = async () => {
    setRequestSubmitting(true);
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/user/request-analytical-access`, {}, {
        headers: { token }
      });
      if (response.data.success) {
        setAccessStatus("pending");
        setStatusMessage({ type: "success", text: response.data.message });
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Access request submission error:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to dispatch analytical access request."
      });
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Calendar utility navigators
  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Verifying credentials and loading dataset...</p>
      </div>
    );
  }

  // Render Access Requested Screen (none, rejected)
  if (accessStatus === "none" || accessStatus === "rejected") {
    return (
      <div className="dashboard-page dashboard-page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="m3-card m3-card-elevated" style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "4.5rem", color: "var(--md-sys-color-primary)", padding: "16px", backgroundColor: "var(--md-sys-color-primary-container)", borderRadius: "24px" }}>
            monitoring
          </span>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800", color: "var(--md-sys-color-on-surface)" }}>
            Analytical Access Required
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--md-sys-color-on-surface-variant)", lineHeight: "1.5" }}>
            The **Analytical Dashboard** contains sensitive financial details, including revenue streams, weekly sales trends, and sales calendar trackers.
          </p>
          {accessStatus === "rejected" && (
            <div style={{
              padding: "10px 14px",
              backgroundColor: "var(--md-sys-color-error-container)",
              color: "var(--md-sys-color-on-error-container)",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: "600",
              lineHeight: "1.4"
            }}>
              ⚠️ Your previous request was declined by the Super Admin. You may request access again if you need to review analytics.
            </div>
          )}
          <button 
            type="button" 
            className="m3-btn m3-btn-filled" 
            disabled={requestSubmitting}
            onClick={handleRequestAccess}
            style={{ width: "100%", marginTop: "8px" }}
          >
            <span className="material-symbols-outlined">key</span>
            {requestSubmitting ? "Requesting..." : "Submit Access Request"}
          </button>
        </div>
      </div>
    );
  }

  // Render Access Pending Screen
  if (accessStatus === "pending") {
    return (
      <div className="dashboard-page dashboard-page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="m3-card m3-card-elevated" style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "4.5rem", color: "var(--md-sys-color-tertiary)", padding: "16px", backgroundColor: "var(--md-sys-color-tertiary-container)", borderRadius: "24px" }}>
            pending_actions
          </span>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800", color: "var(--md-sys-color-on-surface)" }}>
            Access Request Pending
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--md-sys-color-on-surface-variant)", lineHeight: "1.5" }}>
            Your request to unlock the **Analytical Dashboard** is pending review. Please wait for the Super Admin to authorize your credentials.
          </p>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.85rem",
            color: "var(--md-sys-color-tertiary)",
            fontWeight: "700",
            backgroundColor: "var(--md-sys-color-tertiary-container)",
            padding: "8px 16px",
            borderRadius: "20px",
            marginTop: "8px"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>hourglass_top</span>
            Awaiting Approval
          </div>
        </div>
      </div>
    );
  }

  // Render full Analytical Dashboard if approved
  const targetProgress = Math.min(100, Math.round((stats.monthlySales / settings.salesTarget) * 100));

  // Calendar Day Rendering Logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const dayCells = [];
  // Empty slots before month starts
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Active dates mapping revenue metrics
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(month + 1).padStart(2, "0");
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;
    const dayRevenue = stats.calendarSales[dateKey] || 0;

    let heatClass = "";
    if (dayRevenue > 10000) heatClass = "high-revenue";
    else if (dayRevenue > 3000) heatClass = "medium-revenue";
    else if (dayRevenue > 0) heatClass = "low-revenue";

    dayCells.push(
      <div key={`day-${day}`} className={`calendar-day ${heatClass}`}>
        <span className="day-number">{day}</span>
        {dayRevenue > 0 && <span className="day-revenue">₹{dayRevenue.toFixed(0)}</span>}
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-page-container">
      <h2 className="page-title">Analytical Dashboard</h2>

      {statusMessage.text && (
        <div className={`status-banner m3-card-elevated ${statusMessage.type}`} style={{ marginBottom: "20px" }}>
          {statusMessage.text}
        </div>
      )}

      {/* Sales Stats Grid Overview */}
      <div className="stats-cards-grid">
        <div className="stat-card m3-card m3-card-outlined">
          <span className="material-symbols-outlined stat-card-icon">payments</span>
          <div className="stat-card-info">
            <span className="stat-label">Weekly Sales</span>
            <span className="stat-val">₹{stats.weeklySales.toFixed(2)}</span>
          </div>
        </div>

        <div className="stat-card m3-card m3-card-outlined">
          <span className="material-symbols-outlined stat-card-icon">calendar_month</span>
          <div className="stat-card-info">
            <span className="stat-label">Monthly Sales</span>
            <span className="stat-val">₹{stats.monthlySales.toFixed(2)}</span>
          </div>
        </div>

        <div className="stat-card m3-card m3-card-outlined">
          <span className="material-symbols-outlined stat-card-icon">query_stats</span>
          <div className="stat-card-info">
            <span className="stat-label">Quarterly Sales</span>
            <span className="stat-val">₹{stats.quarterlySales.toFixed(2)}</span>
          </div>
        </div>

        <div className="stat-card m3-card m3-card-outlined">
          <span className="material-symbols-outlined stat-card-icon">show_chart</span>
          <div className="stat-card-info">
            <span className="stat-label">Yearly Sales</span>
            <span className="stat-val">₹{stats.yearlySales.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Calendar Sales Dashboard Section */}
      <div className="calendar-section m3-card m3-card-outlined" style={{ marginTop: "24px" }}>
        <div className="calendar-header">
          <div className="calendar-title-info">
            <h3 className="section-title">Sales Calendar</h3>
            <p className="section-description">Daily sales metrics visualized in a calendar month view.</p>
          </div>
          <div className="calendar-nav-buttons">
            <button type="button" className="m3-btn m3-btn-text" onClick={handlePrevMonth} style={{ padding: "6px 12px", minWidth: "fit-content" }}>
              <span className="material-symbols-outlined">chevron_left</span>
              Prev
            </button>
            <span className="current-month-year">{monthNames[month]} {year}</span>
            <button type="button" className="m3-btn m3-btn-text" onClick={handleNextMonth} style={{ padding: "6px 12px", minWidth: "fit-content" }}>
              Next
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="calendar-grid-wrapper">
          <div className="calendar-weekdays">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          <div className="calendar-days-grid">
            {dayCells}
          </div>
        </div>
      </div>

      {/* Target Progress & Discount Settings controls */}
      <div className="dashboard-sections-grid">
        {/* Sales Target Meter Section */}
        <div className="target-progress-card m3-card m3-card-outlined" style={{ width: "100%" }}>
          <h3 className="section-title">Monthly Target Progress</h3>
          <p className="section-description">Monthly revenue tracking versus goals.</p>

          <div className="progress-details" style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>₹{stats.monthlySales.toFixed(2)} / ₹{settings.salesTarget.toFixed(2)}</span>
              <span style={{ color: "var(--md-sys-color-primary)", fontWeight: "700" }}>{targetProgress}%</span>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${targetProgress}%` }}></div>
            </div>
            
            <p style={{ fontSize: "0.75rem", color: "var(--md-sys-color-on-surface-variant)", marginTop: "12px", lineHeight: "1.4" }}>
              {targetProgress >= 100 
                ? "🎉 Congratulations! You have surpassed this month's revenue target!"
                : `Keep going! You need ₹${Math.max(0, settings.salesTarget - stats.monthlySales).toFixed(2)} more to reach the benchmark.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Lower Grid: Sales Bar Chart & Top Products */}
      <div className="dashboard-charts-grid">
        {/* Daily Sales Chart */}
        <div className="chart-card m3-card m3-card-outlined">
          <h3 className="section-title">Weekly Sales Trend</h3>
          <p className="section-description">Daily revenues for the past 7 days.</p>
          
          {stats.dailySales.length > 0 ? (
            <div className="bar-chart-container">
              {stats.dailySales.map((day, idx) => {
                const maxRevenue = Math.max(...stats.dailySales.map(d => d.revenue), 1);
                const barHeight = `${Math.max(10, Math.round((day.revenue / maxRevenue) * 150))}px`;
                return (
                  <div key={idx} className="chart-bar-wrapper">
                    <span className="bar-value">₹{day.revenue.toFixed(0)}</span>
                    <div className="chart-bar" style={{ height: barHeight }}></div>
                    <span className="bar-label">{day.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--md-sys-color-on-surface-variant)" }}>
              No sales data trends to plot.
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="top-products-card m3-card m3-card-outlined">
          <h3 className="section-title">Highly Ordered Items</h3>
          <p className="section-description">Top-selling menu items by ordered quantity.</p>

          <div className="top-items-table" style={{ marginTop: "12px" }}>
            <div className="table-header">
              <b>Dish Name</b>
              <b>Orders</b>
            </div>
            <hr />
            <div className="table-rows">
              {stats.topItems.length > 0 ? (
                stats.topItems.map((item, idx) => (
                  <div key={idx} className="table-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="dish-rank">#{idx + 1}</span>
                      <span className="dish-name">{item.name}</span>
                    </div>
                    <span className="dish-qty">{item.quantity} portions</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--md-sys-color-on-surface-variant)" }}>
                  No dishes ordered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
