import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [food_list, setFoodList] = useState([]);
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [activeDiscount, setActiveDiscount] = useState(0);
  const [storeSettings, setStoreSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState("delivery");
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Add item to cart
  const addToCart = async (itemId) => {
    setCartItems((prev) => {
      const currentQty = prev[itemId] || 0;
      return { ...prev, [itemId]: currentQty + 1 };
    });

    if (token) {
      try {
        await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
      } catch (error) {
        console.error("Error adding item to cart in backend:", error);
      }
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => {
      const currentQty = prev[itemId] || 0;
      if (currentQty <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: currentQty - 1 };
    });

    if (token) {
      try {
        await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
      } catch (error) {
        console.error("Error removing item from cart in backend:", error);
      }
    }
  };

  // Calculate item-specific discount based on active settings
  const getProductDiscount = (item) => {
    if (!storeSettings || !storeSettings.activeDiscount) return 0;
    
    const scope = storeSettings.discountScope || "global";
    const discount = storeSettings.activeDiscount;

    if (scope === "global") {
      return discount;
    } else if (scope === "category") {
      return item.category === storeSettings.discountCategory ? discount : 0;
    } else if (scope === "product") {
      return item._id === storeSettings.discountProduct ? discount : 0;
    }
    return 0;
  };

  // Calculate cart total amount with active discount
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          const discount = getProductDiscount(itemInfo);
          const discountRate = discount ? (100 - discount) / 100 : 1;
          totalAmount += (itemInfo.price * discountRate) * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  // Get total quantity of items in the cart (filtered to only count items existing in active catalog)
  const getCartCount = () => {
    let count = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const exists = food_list.some((product) => product._id === item);
        if (exists) {
          count += cartItems[item];
        }
      }
    }
    return count;
  };

  // Fetch active discount settings from backend
  const fetchSettings = async () => {
    try {
      const response = await axios.get(url + "/api/settings");
      if (response.data.success) {
        setStoreSettings(response.data.data);
        setActiveDiscount(response.data.data.activeDiscount || 0);
        if (response.data.data.orderMode === "dine-in") {
          setFulfillmentType("dine-in");
        } else if (response.data.data.orderMode === "online") {
          setFulfillmentType("delivery");
        }
      }
    } catch (error) {
      console.error("Error loading active discounts:", error);
    }
  };

  // Fetch menu categories from backend database
  const fetchCategories = async () => {
    try {
      const response = await axios.get(url + "/api/category/list");
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Fetch food items from backend database
  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      if (response.data.success) {
        setFoodList(response.data.data);
      } else {
        console.error("Error fetching food list:", response.data.message);
      }
    } catch (error) {
      console.error("Offline or unable to connect to backend api. Using fallback seed data.");
      // Fallback seed data if server is down for presentation purposes
      setFoodList(getFallbackFoodList());
    }
  };

  // Load backend cart data of logged-in user
  const loadCartData = async (activeToken) => {
    try {
      const response = await axios.post(url + "/api/cart/get", {}, { headers: { token: activeToken } });
      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      }
    } catch (error) {
      console.error("Error loading cart data from backend:", error);
    }
  };

  // Fallback items in case mongo backend isn't populated yet
  const getFallbackFoodList = () => {
    return [
      {
        _id: "seed_1",
        name: "Greek Salad",
        price: 150,
        description: "Fresh vegetables mixed with crisp lettuce, feta cheese, and olives.",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80",
        category: "Salad",
        dietType: "Veg"
      },
      {
        _id: "seed_2",
        name: "Veg Salad",
        price: 120,
        description: "Healthy garden salad packed with nutrients and light vinaigrette dressing.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
        category: "Salad",
        dietType: "Veg"
      },
      {
        _id: "seed_3",
        name: "Clover Salad",
        price: 160,
        description: "A premium signature mix salad with edible flowers and nuts.",
        image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=500&q=80",
        category: "Salad",
        dietType: "Veg"
      },
      {
        _id: "seed_4",
        name: "Chicken Salad",
        price: 220,
        description: "Grilled chicken breast slides served over crisp organic greens.",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        category: "Salad",
        dietType: "Non-Veg"
      },
      {
        _id: "seed_5",
        name: "Lasagna",
        price: 240,
        description: "Layers of pasta sheets, rich bolognese sauce, creamy bechamel, and cheese.",
        image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=500&q=80",
        category: "Pasta",
        dietType: "Non-Veg"
      },
      {
        _id: "seed_6",
        name: "Garlic Butter Pasta",
        price: 180,
        description: "Tossed pasta in smooth melted butter garlic emulsion with herbs.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80",
        category: "Pasta",
        dietType: "Veg"
      },
      {
        _id: "seed_7",
        name: "Creamy Alfredo",
        price: 260,
        description: "Classic rich alfredo cream sauce over a bed of fettuccine pasta.",
        image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=500&q=80",
        category: "Pasta",
        dietType: "Veg"
      },
      {
        _id: "seed_8",
        name: "Strawberry Cake",
        price: 110,
        description: "Light chiffon sponge cake layers decorated with fresh strawberries.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
        category: "Cake",
        dietType: "Veg"
      },
      {
        _id: "seed_9",
        name: "Chocolate Fudge",
        price: 130,
        description: "Rich, dense chocolate cake layered with dark chocolate ganache icing.",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80",
        category: "Cake",
        dietType: "Veg"
      },
      {
        _id: "seed_10",
        name: "Red Velvet",
        price: 140,
        description: "Traditional crimson cake layers filled with luscious cream cheese frosting.",
        image: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=500&q=80",
        category: "Cake",
        dietType: "Veg"
      }
    ];
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      await fetchSettings();
      await fetchCategories();
      const localToken = localStorage.getItem("token");
      if (localToken) {
        setToken(localToken);
        setUserName(localStorage.getItem("userName") || "User");
        setRole(localStorage.getItem("role") || "customer");
        await loadCartData(localToken);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (storeSettings?.orderMode === "dine-in") {
      setFulfillmentType("dine-in");
    } else if (storeSettings?.orderMode === "online") {
      setFulfillmentType("delivery");
    }
  }, [storeSettings]);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getCartAmount,
    getCartCount,
    url,
    token,
    setToken,
    userName,
    setUserName,
    role,
    setRole,
    activeDiscount,
    setActiveDiscount,
    storeSettings,
    getProductDiscount,
    categories,
    fulfillmentType,
    setFulfillmentType
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
