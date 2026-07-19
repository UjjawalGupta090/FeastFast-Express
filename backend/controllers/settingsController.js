import settingsModel from "../models/settingsModel.js";
import { broadcastLiveUpdate } from "../utils/liveUpdates.js";

// Fetch store configuration (auto-creates a default one if none exists)
const getSettings = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    if (!settings) {
      settings = new settingsModel({
        salesTarget: 50000,
        activeDiscount: 0,
        promoCode: "",
        discountScope: "global",
        discountCategory: "",
        discountProduct: "",
        orderMode: "both",
        deliveryRadius: 5
      });
      await settings.save();
    }
    
    // Attach coordinates from environment variable config
    const settingsObj = settings.toObject();
    settingsObj.restaurantLat = Number(process.env.RESTAURANT_LAT) || 28.071871;
    settingsObj.restaurantLon = Number(process.env.RESTAURANT_LON) || 80.096588;

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Error loading store store settings" });
  }
};

// Update store configuration (restricted to admins)
const updateSettings = async (req, res) => {
  const { 
    salesTarget, 
    activeDiscount, 
    promoCode, 
    discountScope, 
    discountCategory, 
    discountProduct, 
    orderMode,
    deliveryRadius
  } = req.body;
  try {
    let settings = await settingsModel.findOne();
    if (!settings) {
      settings = new settingsModel({
        salesTarget: salesTarget || 50000,
        activeDiscount: activeDiscount || 0,
        promoCode: promoCode || "",
        discountScope: discountScope || "global",
        discountCategory: discountCategory || "",
        discountProduct: discountProduct || "",
        orderMode: orderMode || "both",
        deliveryRadius: deliveryRadius || 5
      });
    } else {
      if (salesTarget !== undefined) settings.salesTarget = Number(salesTarget);
      if (activeDiscount !== undefined) settings.activeDiscount = Number(activeDiscount);
      if (promoCode !== undefined) settings.promoCode = promoCode;
      if (discountScope !== undefined) settings.discountScope = discountScope;
      if (discountCategory !== undefined) settings.discountCategory = discountCategory;
      if (discountProduct !== undefined) settings.discountProduct = discountProduct;
      if (orderMode !== undefined) settings.orderMode = orderMode;
      if (deliveryRadius !== undefined) settings.deliveryRadius = Number(deliveryRadius);
    }

    await settings.save();
    
    // Attach coordinates from environment variable config
    const settingsObj = settings.toObject();
    settingsObj.restaurantLat = Number(process.env.RESTAURANT_LAT) || 28.071871;
    settingsObj.restaurantLon = Number(process.env.RESTAURANT_LON) || 80.096588;

    broadcastLiveUpdate("settingsUpdated");

    res.json({ success: true, message: "Settings updated successfully!", data: settingsObj });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, message: "Failed to save store settings" });
  }
};

export { getSettings, updateSettings };
