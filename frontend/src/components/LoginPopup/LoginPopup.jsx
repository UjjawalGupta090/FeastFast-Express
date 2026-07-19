import React, { useContext, useEffect, useRef, useState } from "react";
import "./LoginPopup.css";
import { StoreContext } from "../../context/StoreContext";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const LoginPopup = ({ showLogin, setShowLogin }) => {
  const { url, setToken, setUserName, setRole } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Sign Up");
  const [loginRole, setLoginRole] = useState("customer");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const dialogRef = useRef(null);

  // Sync role selector when popup opens in a specific mode
  useEffect(() => {
    if (showLogin === "admin") {
      setLoginRole("admin");
      setCurrState("Login");
    } else if (showLogin === "customer" || showLogin === true) {
      setLoginRole("customer");
    }
  }, [showLogin]);

  // Sync React showLogin state with native dialog state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showLogin) {
      setErrorMessage("");
      setData({ name: "", email: "", password: "" });
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [showLogin]);

  // Handle click outside dialog to close (backdrop light-dismiss fallback)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isDialogContent) {
        setShowLogin(false);
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [setShowLogin]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setLoginRole(role);
    setErrorMessage("");
    setData({ name: "", email: "", password: "" });
    if (role === "admin") {
      setCurrState("Login");
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    let endpoint = "/api/user/login";
    if (loginRole === "customer" && currState === "Sign Up") {
      endpoint = "/api/user/register";
    }

    try {
      const response = await axios.post(url + endpoint, data);
      if (response.data.success) {
        // Enforce admin check if logging in through the Admin tab
        if (loginRole === "admin" && response.data.role !== "admin") {
          setErrorMessage("Access Denied: You do not have administrator permissions.");
          setLoading(false);
          return;
        }

        setToken(response.data.token);
        setUserName(response.data.name || "User");
        setRole(response.data.role || "customer");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userName", response.data.name || "User");
        localStorage.setItem("role", response.data.role || "customer");

        // Redirect to admin dashboard automatically if logged in as Admin
        if (response.data.role === "admin") {
          window.location.href = `/admin/?token=${response.data.token}&role=${response.data.role}&name=${encodeURIComponent(response.data.name || "Admin")}`;
        } else {
          setShowLogin(false);
        }
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMessage(error.response?.data?.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setErrorMessage("");
    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/user/google-login`, {
        credential: response.credential
      });

      if (res.data.success) {
        setToken(res.data.token);
        setUserName(res.data.name || "Google User");
        setRole(res.data.role || "customer");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userName", res.data.name || "Google User");
        localStorage.setItem("role", res.data.role || "customer");

        setShowLogin(false);
      } else {
        setErrorMessage(res.data.message || "Google Authentication failed.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setErrorMessage(err.response?.data?.message || "Google Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loginRole !== "customer" || !showLogin) return;

    const scriptId = "google-gis-script";
    let script = document.getElementById(scriptId);
    
    const initGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "674236098793-83is78llkauo1n1misi72f29p4mt15fs.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse
        });

        const btnContainer = document.getElementById("google-signin-btn");
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            text: currState === "Sign Up" ? "signup_with" : "signin_with",
            width: 340
          });
        }
        window.google.accounts.id.prompt();
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google) {
          clearInterval(checkInterval);
          initGoogleSignIn();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [loginRole, showLogin, currState]);

  return (
    <dialog 
      ref={dialogRef} 
      className={`login-popup ${loginRole === "admin" ? "admin-mode" : ""}`}
      closedby="any" 
      onClose={() => setShowLogin(false)}
      aria-labelledby="auth-title"
    >
      <div className="login-popup-header">
        <div className="title-section">
          <h2 id="auth-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {loginRole === "admin" && (
              <span className="material-symbols-outlined" style={{ fontSize: "1.75rem" }}>
                admin_panel_settings
              </span>
            )}
            {loginRole === "admin" ? "Admin Login" : currState}
          </h2>
          {loginRole === "admin" && <span className="admin-subtitle">Secure Access Only</span>}
        </div>
        <button className="close-dialog-btn" onClick={() => setShowLogin(false)} aria-label="Close authentication">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-role-selector">
          <button 
            type="button" 
            className={`role-tab ${loginRole === "customer" ? "active" : ""}`}
            onClick={() => handleRoleChange("customer")}
          >
            Customer
          </button>
          <button 
            type="button" 
            className={`role-tab ${loginRole === "admin" ? "active" : ""}`}
            onClick={() => handleRoleChange("admin")}
          >
            Admin
          </button>
        </div>

        {errorMessage && <div className="error-banner m3-card-elevated">{errorMessage}</div>}

        <div className="login-popup-inputs">
          {currState === "Sign Up" && loginRole === "customer" && (
            <div className="m3-text-field">
              <input
                type="text"
                name="name"
                onChange={onChangeHandler}
                value={data.name}
                placeholder=" "
                required
              />
              <label>Your Name</label>
            </div>
          )}
          
          <div className="m3-text-field">
            <input
              type="email"
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              placeholder=" "
              required
            />
            <label>{loginRole === "admin" ? "Admin Email" : "Email Address"}</label>
          </div>
          
          <div className="m3-text-field">
            <input
              type="password"
              name="password"
              onChange={onChangeHandler}
              value={data.password}
              placeholder=" "
              required
            />
            <label>Password</label>
          </div>
        </div>

        <button type="submit" className="m3-btn m3-btn-filled submit-auth-btn" disabled={loading}>
          {loading ? "Processing..." : loginRole === "admin" ? "Sign In to Dashboard" : currState === "Sign Up" ? "Create Account" : "Sign In"}
        </button>

        {loginRole === "customer" && (
          <>
            <div style={{ display: "flex", alignItems: "center", margin: "14px 0 10px 0", gap: "8px" }}>
              <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--md-sys-color-outline-variant)", opacity: 0.5 }} />
              <span style={{ fontSize: "0.8rem", color: "var(--md-sys-color-on-surface-variant)", fontWeight: 600 }}>or</span>
              <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--md-sys-color-outline-variant)", opacity: 0.5 }} />
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", width: "100%", minHeight: "44px" }}>
              <div id="google-signin-btn" style={{ width: "100%", display: "flex", justifyContent: "center" }}></div>
            </div>
          </>
        )}

        {loginRole === "customer" && (
          <div className="login-popup-condition">
            <input type="checkbox" id="terms-check" required />
            <label htmlFor="terms-check">By continuing, I agree to the terms of use & privacy policy.</label>
          </div>
        )}

        {loginRole === "customer" && (
          currState === "Login" ? (
            <p className="auth-toggle-text">
              Create a new account?{" "}
              <span className="toggle-link" onClick={() => setCurrState("Sign Up")}>Click here</span>
            </p>
          ) : (
            <p className="auth-toggle-text">
              Already have an account?{" "}
              <span className="toggle-link" onClick={() => setCurrState("Login")}>Login here</span>
            </p>
          )
        )}
      </form>
    </dialog>
  );
};

export default LoginPopup;
