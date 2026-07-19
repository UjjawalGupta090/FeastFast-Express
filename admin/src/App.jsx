import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import axios from "axios";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Admins from "./pages/Admins/Admins";
import Users from "./pages/Users/Users";
import Categories from "./pages/Categories/Categories";
import Dashboard from "./pages/Dashboard/Dashboard";
import Analytics from "./pages/Analytics/Analytics";

const App = () => {
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

  // Check URL query parameters for login credentials, or redirect if unauthenticated
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
      // Clean up URL parameters to keep the URL clean
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (!token || role !== "admin") {
      // Redirect to main storefront to log in
      window.location.href = (import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173") + "/?openLogin=admin";
    }
  }, [token, role]);

  const checkPendingOrders = async (authToken) => {
    try {
      const response = await axios.get(`${url}/api/order/list`, { headers: { token: authToken } });
      if (response.data.success) {
        const hasPending = (response.data.data || []).some(o => o.status === "Placed");
        if (hasPending && window.location.pathname !== "/orders") {
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

  // Sync token from localStorage if modified elsewhere (e.g. from the client tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token") || "");
      setRole(localStorage.getItem("role") || "");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
          if (data.type === "orderPlaced") {
            playTingSound();
            if (window.location.pathname !== "/orders") {
              setHasNewOrders(true);
            }
          }
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    setToken("");
    setRole("");
  };

  // Render Redirection Splash Screen if not authenticated as Admin
  if (!token || role !== "admin") {
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
        }}>Redirecting to main website for authentication...</p>
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
      <Navbar onLogout={handleLogout} />
      <hr />
      <div className="app-content">
        <Sidebar hasNewOrders={hasNewOrders} setHasNewOrders={setHasNewOrders} />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard url={url} token={token} />} />
            <Route path="/analytics" element={<Analytics url={url} token={token} />} />
            <Route path="/add" element={<Add url={url} token={token} />} />
            <Route path="/list" element={<List url={url} token={token} />} />
            <Route path="/orders" element={<Orders url={url} token={token} />} />
            <Route path="/admins" element={<Admins url={url} token={token} />} />
            <Route path="/users" element={<Users url={url} token={token} />} />
            <Route path="/categories" element={<Categories url={url} token={token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
