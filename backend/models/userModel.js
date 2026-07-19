import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  cartData: { type: Object, default: {} },
  addresses: { type: Array, default: [] },
  isBlocked: { type: Boolean, default: false },
  analyticalAccess: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" }
}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
