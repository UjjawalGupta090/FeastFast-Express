import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Placed" },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },
  paymentMethod: { type: String, default: "Online" },
  notes: { type: String, default: "" },
  adminNote: { type: String, default: "" }
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
