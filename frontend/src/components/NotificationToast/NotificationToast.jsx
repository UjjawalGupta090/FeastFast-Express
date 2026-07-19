import React, { useEffect, useState } from "react";
import "./NotificationToast.css";

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([]);

  const playNotificationSound = (status) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = status === "Cancelled" ? "sawtooth" : "sine";
      const freq = status === "Cancelled" ? 300 : status === "Delivered" ? 1056 : 880;

      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  useEffect(() => {
    const handleNotification = (e) => {
      const data = e.detail;
      if (!data) return;

      let title = "Order Update";
      let message = "Your order status has been updated.";
      let type = "info";
      let icon = "notifications";

      if (data.type === "orderPlaced") {
        title = "New Order Placed!";
        message = "Your order was received successfully.";
        type = "success";
        icon = "shopping_bag";
      } else if (data.type === "orderUpdated" && data.status) {
        switch (data.status) {
          case "Cancelled":
            title = "Order Cancelled";
            message = data.adminNote 
              ? `Order was cancelled: ${data.adminNote}`
              : "Your order was cancelled by the store.";
            type = "danger";
            icon = "cancel";
            break;
          case "Out for delivery":
            title = "Out for Delivery! 🛵";
            message = "Your delicious food is on its way to you!";
            type = "primary";
            icon = "local_shipping";
            break;
          case "Food Processing":
            title = "Food Being Prepared 🍳";
            message = "The kitchen is actively preparing your meal.";
            type = "warning";
            icon = "outdoor_grill";
            break;
          case "Delivered":
            title = "Order Delivered 🎉";
            message = "Your order has been delivered. Enjoy your meal!";
            type = "success";
            icon = "check_circle";
            break;
          default:
            title = `Order Status: ${data.status}`;
            message = `Your order status changed to "${data.status}".`;
            type = "info";
            icon = "info";
        }
      }

      playNotificationSound(data.status);

      const id = Date.now() + Math.random();
      const newNotif = { id, title, message, type, icon };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    };

    window.addEventListener("live-refresh", handleNotification);
    return () => window.removeEventListener("live-refresh", handleNotification);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-toast-container">
      {notifications.map((notif) => (
        <div key={notif.id} className={`notification-toast-card notif-${notif.type}`}>
          <div className="notif-icon-box">
            <span className="material-symbols-outlined">{notif.icon}</span>
          </div>
          <div className="notif-content">
            <h4 className="notif-title">{notif.title}</h4>
            <p className="notif-message">{notif.message}</p>
          </div>
          <button className="notif-close-btn" onClick={() => removeNotification(notif.id)} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
