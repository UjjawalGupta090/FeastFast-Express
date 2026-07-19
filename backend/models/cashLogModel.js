import mongoose from "mongoose";

const cashLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  cashAmount: { type: Number, default: 0 },
  recordedBy: { type: String, default: "" }
}, { timestamps: true });

const cashLogModel = mongoose.models.cashLog || mongoose.model("cashLog", cashLogSchema);
export default cashLogModel;
