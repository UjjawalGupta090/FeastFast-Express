import React, { useEffect, useState } from "react";
import "./List.css";
import axios from "axios";

const List = ({ url, token }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Failed to load food list" });
      }
    } catch (error) {
      console.error("Error loading food list:", error);
      setStatusMessage({ type: "error", text: "Offline or unable to connect to the backend server." });
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId) => {
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        await fetchList();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error removing food:", error);
      setStatusMessage({ type: "error", text: "Error removing food item. Please try again." });
    }
  };

  const toggleStock = async (foodId) => {
    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/food/toggle-stock`, { id: foodId }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        await fetchList();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error toggling stock status:", error);
      setStatusMessage({ type: "error", text: "Error updating stock status. Please try again." });
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Auto-hide status banner after 2.5 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage.text]);

  return (
    <div className="list-page dashboard-page-container">
      <div className="list-page-header">
        <h2 className="page-title">All Foods Catalog</h2>
        <span className="catalog-count">{list.length} Items</span>
      </div>

      {statusMessage.text && (
        <div className={`status-banner m3-card-elevated ${statusMessage.type} fade-1s`}>
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="list-loading">
          <div className="m3-spinner"></div>
          <p>Loading catalog database...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="list-empty m3-card m3-card-outlined">
          <span className="material-symbols-outlined empty-icon">restaurant</span>
          <h3>Catalog is empty</h3>
          <p>Go to the Add Food page to insert new items into your database.</p>
        </div>
      ) : (
        <div className="list-table m3-card m3-card-outlined">
          <div className="list-table-format header-row">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Stock Status</b>
            <b>Action</b>
          </div>
          <hr />
          <div className="list-table-rows">
            {list.map((item, index) => {
              const imageUrl = item.image.startsWith("http") ? item.image : `${url}/images/${item.image}`;
              const inStock = item.inStock !== false;
              return (
                <div key={item._id || index}>
                  <div className="list-table-format list-item-row">
                    <img src={imageUrl} alt={item.name} className="list-item-img" />
                    <p className="list-item-name">{item.name}</p>
                    <p className="list-item-category" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {item.category}
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        color: item.dietType === "Veg" ? "#2e6a4f" : "#ba1a1a",
                        backgroundColor: item.dietType === "Veg" ? "#e8f5e9" : "#ffebee"
                      }}>
                        {item.dietType || "Veg"}
                      </span>
                    </p>
                    <p className="list-item-price">₹{item.price.toFixed(2)}</p>
                    
                    <button 
                      type="button"
                      className={`stock-toggle-btn ${inStock ? "in-stock" : "out-of-stock"}`}
                      onClick={() => toggleStock(item._id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
                        {inStock ? "check_circle" : "cancel"}
                      </span>
                      {inStock ? "In Stock" : "Out of Stock"}
                    </button>

                    <button 
                      className="delete-btn" 
                      onClick={() => removeFood(item._id)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  <hr />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
