import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Add food item
const addFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image upload failed" });
    }

    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      image: image_filename
    });

    await food.save();
    res.json({ success: true, message: "Food Added Successfully" });
  } catch (error) {
    console.error("Error in addFood:", error);
    res.status(500).json({ success: false, message: "Error adding food item" });
  }
};

// List all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("Error in listFood:", error);
    res.status(500).json({ success: false, message: "Error fetching food items" });
  }
};

// Remove food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    // Delete image file from filesystem
    const imagePath = path.join("uploads", food.image);
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting image file:", err.message);
    });

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Food Removed Successfully" });
  } catch (error) {
    console.error("Error in removeFood:", error);
    res.status(500).json({ success: false, message: "Error removing food item" });
  }
};

// Fetch recommendations based on user order history (Iterative recommendation system)
const getRecommendations = async (req, res) => {
  try {
    const allFoods = await foodModel.find({});
    
    // Check if token exists in headers for authentication
    const token = req.headers.token;
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_key_12345");
        userId = decoded.id;
      } catch (err) {
        // Invalid token, treat as guest
      }
    }

    // Popularity fallback logic if guest or no orders
    const getPopularRecommendations = async () => {
      const paidOrders = await orderModel.find({ payment: true });
      const quantities = {};
      paidOrders.forEach((o) => {
        if (Array.isArray(o.items)) {
          o.items.forEach((item) => {
            quantities[item.name] = (quantities[item.name] || 0) + (item.quantity || 0);
          });
        }
      });

      return allFoods
        .map((food) => ({
          ...food.toObject(),
          score: quantities[food.name] || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
    };

    if (!userId) {
      const popular = await getPopularRecommendations();
      return res.json({ success: true, isPersonalized: false, data: popular });
    }

    // Load paid orders for this user
    const userOrders = await orderModel.find({ userId, payment: true });
    if (userOrders.length === 0) {
      const popular = await getPopularRecommendations();
      return res.json({ success: true, isPersonalized: false, data: popular });
    }

    // Aggregate category and dietary history
    const categoriesCount = {};
    let vegCount = 0;
    let nonVegCount = 0;
    const orderedItems = {}; // track items previously ordered

    userOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const qty = item.quantity || 1;
          categoriesCount[item.category] = (categoriesCount[item.category] || 0) + qty;
          orderedItems[item.name] = (orderedItems[item.name] || 0) + qty;

          if (item.dietType === "Veg") vegCount += qty;
          else if (item.dietType === "Non-Veg") nonVegCount += qty;
        });
      }
    });

    // Find favorite category
    let favoriteCategory = "";
    let maxCatQty = 0;
    Object.keys(categoriesCount).forEach((cat) => {
      if (categoriesCount[cat] > maxCatQty) {
        maxCatQty = categoriesCount[cat];
        favoriteCategory = cat;
      }
    });

    // Find majority dietary preference
    const favoriteDiet = vegCount >= nonVegCount ? "Veg" : "Non-Veg";

    // Score all foods in database based on user history
    const recommendedFoods = allFoods.map((food) => {
      let score = 0;

      // Category match: +3 points
      if (food.category === favoriteCategory) {
        score += 3;
      }

      // Dietary preference match: +2 points
      if (food.dietType === favoriteDiet) {
        score += 2;
      }

      // Prior order history:
      if (orderedItems[food.name] > 0) {
        score += Math.min(3, orderedItems[food.name] * 0.5); // Cap repeat order score boost
      } else {
        score += 1.5; // Trial boost for new items
      }

      return {
        ...food.toObject(),
        score
      };
    });

    // Sort by score descending and return top 4
    const topRecommended = recommendedFoods
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    res.json({ success: true, isPersonalized: true, data: topRecommended });
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    res.status(500).json({ success: false, message: "Error loading recommendations" });
  }
};

// Toggle food stock status
const toggleStockFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }
    
    // Toggle inStock field (defaults to true if undefined)
    food.inStock = food.inStock !== false ? false : true;
    await food.save();
    
    res.json({ success: true, message: `Stock status updated: ${food.name} is now ${food.inStock ? "In Stock" : "Out of Stock"}`, inStock: food.inStock });
  } catch (error) {
    console.error("Error in toggleStockFood:", error);
    res.status(500).json({ success: false, message: "Error updating stock status" });
  }
};

export { addFood, listFood, removeFood, getRecommendations, toggleStockFood };
