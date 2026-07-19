import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  salesTarget: { type: Number, default: 50000 },
  activeDiscount: { type: Number, default: 0 }, // percentage discount 0-100
  promoCode: { type: String, default: "" },
  discountScope: { type: String, enum: ["global", "category", "product"], default: "global" },
  discountCategory: { type: String, default: "" },
  discountProduct: { type: String, default: "" },
  orderMode: { type: String, enum: ["online", "dine-in", "both", "offline"], default: "both" },
  deliveryRadius: { type: Number, default: 5 } // Delivery radius limit in km
}, { timestamps: true });

const settingsModel = mongoose.models.settings || mongoose.model("settings", settingsSchema);

export default settingsModel;
