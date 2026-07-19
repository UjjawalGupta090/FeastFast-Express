import React, { useState, useEffect } from "react";
import { Route, Routes, useSearchParams, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";

// Admin components & styles
import "./admin/admin.css";
import AdminNavbar from "./admin/components/Navbar/Navbar";
import AdminSidebar from "./admin/components/Sidebar/Sidebar";
import axios from "axios";
import Dashboard from "./admin/pages/Dashboard/Dashboard";
import Add from "./admin/pages/Add/Add";
import List from "./admin/pages/List/List";
import Orders from "./admin/pages/Orders/Orders";
import Admins from "./admin/pages/Admins/Admins";
import Users from "./admin/pages/Users/Users";
import Categories from "./admin/pages/Categories/Categories";
import Analytics from "./admin/pages/Analytics/Analytics";

// 1. Customer Layout (Storefront client UI)
const CustomerLayout = ({ setShowLogin }) => {
  return (
    <div className="app-container">
      <Navbar setShowLogin={setShowLogin} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// 2. Admin Layout (Dashboard UI)
const AdminLayout = () => {
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [hasNewOrders, setHasNewOrders] = useState(false);

  const playTingSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      
      const osc2 = audioCtx.createOscillator();
      const gainNode2 = audioCtx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1320, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      
      gainNode2.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode2.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc2.connect(gainNode2);
      gainNode2.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 1.2);
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch (err) {
      console.error("Web Audio playback failed:", err);
    }
  };

  useEffect(() => {
    const handleLiveRefresh = (e) => {
      const data = e.detail;
      if (data && data.type === "orderPlaced") {
        playTingSound();
        if (window.location.pathname !== "/admin/orders") {
          setHasNewOrders(true);
        }
      }
    };
    window.addEventListener("live-refresh", handleLiveRefresh);
    return () => window.removeEventListener("live-refresh", handleLiveRefresh);
  }, []);

  const checkPendingOrders = async (authToken) => {
    try {
      const response = await axios.get(`${url}/api/order/list`, { headers: { token: authToken } });
      if (response.data.success) {
        const hasPending = (response.data.data || []).some(o => o.status === "Placed");
        if (hasPending && window.location.pathname !== "/admin/orders") {
          setHasNewOrders(true);
        }
      }
    } catch (err) {
      console.error("Error checking pending orders:", err);
    }
  };

  useEffect(() => {
    if (token && role === "admin") {
      checkPendingOrders(token);
    }
  }, [token, role]);

  // Listen for login redirect parameters on initial landing page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlRole = params.get("role");
    const urlName = params.get("name");

    if (urlToken && urlRole === "admin") {
      localStorage.setItem("token", urlToken);
      localStorage.setItem("role", urlRole);
      localStorage.setItem("userName", urlName || "Admin");
      setToken(urlToken);
      setRole(urlRole);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // JS redirect backup timer if unauthenticated
  useEffect(() => {
    if (!token || role !== "admin") {
      const timer = setTimeout(() => {
        window.location.href = window.location.origin + "/?openLogin=admin";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [token, role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    setToken("");
    setRole("");
    window.location.href = window.location.origin + "/";
  };

  if (!token || role !== "admin") {
    // If unauthenticated, redirect automatically to storefront with admin login trigger query
    return (
      <div className="admin-login-page" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--md-sys-color-background)",
        color: "var(--md-sys-color-on-background)",
        fontFamily: "'Outfit', sans-serif",
        gap: "16px"
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: 800,
          color: "var(--md-sys-color-primary)",
          marginBottom: "4px"
        }}>Tomato Admin</h1>
        <p style={{
          fontSize: "0.95rem",
          color: "var(--md-sys-color-on-surface-variant)",
          fontWeight: 600
        }}>Redirecting to storefront for login...</p>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid var(--md-sys-color-outline-variant)",
          borderTopColor: "var(--md-sys-color-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <AdminNavbar onLogout={handleLogout} />
      <hr />
      <div className="app-content">
        <AdminSidebar hasNewOrders={hasNewOrders} setHasNewOrders={setHasNewOrders} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard url={url} token={token} />} />
            <Route path="analytics" element={<Analytics url={url} token={token} />} />
            <Route path="add" element={<Add url={url} token={token} />} />
            <Route path="list" element={<List url={url} token={token} />} />
            <Route path="orders" element={<Orders url={url} token={token} />} />
            <Route path="admins" element={<Admins url={url} token={token} />} />
            <Route path="users" element={<Users url={url} token={token} />} />
            <Route path="categories" element={<Categories url={url} token={token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// 3. Main App Container Router
const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    const openLoginParam = searchParams.get("openLogin");
    if (openLoginParam === "admin" || openLoginParam === "customer") {
      const localToken = localStorage.getItem("token");
      const localRole = localStorage.getItem("role");

      // Auto-redirect if already logged in as admin
      if (openLoginParam === "admin" && localToken && localRole === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      setShowLogin(openLoginParam);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("openLogin");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Set up Server-Sent Events (SSE) live updates listener
  useEffect(() => {
    const sse = new EventSource(`${url}/api/order/live-updates`);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE Live Update Event received:", data);
        if (data.type && data.type !== "connected") {
          // Dispatch custom refresh event to all active listener tabs/views
          window.dispatchEvent(new CustomEvent("live-refresh", { detail: data }));
        }
      } catch (err) {
        console.error("Error parsing SSE live update payload:", err);
      }
    };

    sse.onerror = (error) => {
      console.warn("SSE connection error, attempting reconnection...", error);
    };

    return () => {
      sse.close();
    };
  }, [url]);

  return (
    <>
      {showLogin && <LoginPopup showLogin={showLogin} setShowLogin={setShowLogin} />}
      
      <Routes>
        {/* Admin Dashboard Nested Shell */}
        <Route path="/admin/*" element={<AdminLayout />} />
        
        {/* General Storefront customer routes */}
        <Route path="/*" element={<CustomerLayout setShowLogin={setShowLogin} />} />
      </Routes>
    </>
  );
};

export default App;
