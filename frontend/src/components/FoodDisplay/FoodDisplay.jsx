import React, { useContext, useState } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);
  const [dietFilter, setDietFilter] = useState("All");

  const filteredList = food_list.filter((item) => {
    const matchCategory = category === "All" || category === item.category;
    const matchDiet = dietFilter === "All" || item.dietType === dietFilter;
    return matchCategory && matchDiet;
  });

  return (
    <section className="food-display" id="food-display">
      <div className="food-display-header" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Top dishes near you</h2>
          <span className="results-count">{filteredList.length} items found</span>
        </div>

        {/* Dietary toggle filter row */}
        <div className="diet-filter-row" style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <button
            type="button"
            className={`m3-btn ${dietFilter === "All" ? "m3-btn-filled" : "m3-btn-tonal"}`}
            onClick={() => setDietFilter("All")}
            style={{ padding: "6px 18px", fontSize: "0.8rem", height: "32px" }}
          >
            All
          </button>
          
          <button
            type="button"
            className={`m3-btn ${dietFilter === "Veg" ? "m3-btn-filled" : "m3-btn-tonal"}`}
            onClick={() => setDietFilter("Veg")}
            style={{ 
              padding: "6px 18px", 
              fontSize: "0.8rem", 
              height: "32px", 
              color: dietFilter === "Veg" ? "#ffffff" : "#2e6a4f", 
              backgroundColor: dietFilter === "Veg" ? "#2e6a4f" : "",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ 
              display: "inline-block", 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              backgroundColor: dietFilter === "Veg" ? "#ffffff" : "#2e6a4f" 
            }}></span>
            Veg Only
          </button>

          <button
            type="button"
            className={`m3-btn ${dietFilter === "Non-Veg" ? "m3-btn-filled" : "m3-btn-tonal"}`}
            onClick={() => setDietFilter("Non-Veg")}
            style={{ 
              padding: "6px 18px", 
              fontSize: "0.8rem", 
              height: "32px", 
              color: dietFilter === "Non-Veg" ? "#ffffff" : "#ba1a1a", 
              backgroundColor: dietFilter === "Non-Veg" ? "#ba1a1a" : "",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ 
              display: "inline-block", 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              backgroundColor: dietFilter === "Non-Veg" ? "#ffffff" : "#ba1a1a" 
            }}></span>
            Non-Veg Only
          </button>
        </div>
      </div>
      
      {filteredList.length === 0 ? (
        <div className="empty-display">
          <span className="material-symbols-outlined empty-icon">restaurant</span>
          <p>No dishes found matching your preferences. Check back later!</p>
        </div>
      ) : (
        <div className="food-display-list">
          {filteredList.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              category={item.category}
              dietType={item.dietType || "Veg"}
              inStock={item.inStock !== false}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FoodDisplay;
