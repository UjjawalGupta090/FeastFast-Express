import React, { useContext, useEffect, useState } from "react";
import "./Recommendations.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import axios from "axios";

const Recommendations = () => {
  const { url, token } = useContext(StoreContext);
  const [recList, setRecList] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const headers = token ? { token } : {};
        const response = await axios.get(`${url}/api/food/recommendations`, { headers });
        if (response.data.success) {
          setRecList(response.data.data || []);
          setIsPersonalized(response.data.isPersonalized || false);
        }
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [token, url]);

  if (loading || recList.length === 0) return null;

  return (
    <section className="recommendations-section" id="recommendations" style={{ marginTop: "32px", padding: "0 10px" }}>
      <div className="recommendations-header" style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px"
      }}>
        <span className="material-symbols-outlined recommend-spark-icon" style={{
          color: "var(--md-sys-color-primary)",
          fontSize: "1.65rem",
          animation: "pulse 2s infinite"
        }}>auto_awesome</span>
        <h2 style={{
          fontSize: "1.6rem",
          fontWeight: "800",
          color: "var(--md-sys-color-on-surface)",
          margin: 0
        }}>
          {isPersonalized ? "Recommended For You" : "Trending Dishes"}
        </h2>
        <span style={{
          fontSize: "0.7rem",
          padding: "2px 8px",
          borderRadius: "12px",
          fontWeight: "700",
          backgroundColor: isPersonalized ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-secondary-container)",
          color: isPersonalized ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-secondary-container)",
          border: "1px solid var(--md-sys-color-outline-variant)"
        }}>
          {isPersonalized ? "Personalized" : "Popular"}
        </span>
      </div>
      
      <div className="recommendations-grid">
        {recList.map((item) => (
          <FoodItem
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            dietType={item.dietType || "Veg"}
          />
        ))}
      </div>
      <hr className="detail-divider" style={{
        margin: "36px 0 28px 0",
        border: "none",
        borderTop: "1px solid var(--md-sys-color-outline-variant)",
        opacity: "0.5"
      }} />
    </section>
  );
};

export default Recommendations;
