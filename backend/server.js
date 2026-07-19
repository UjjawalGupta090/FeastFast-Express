import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import settingsRouter from "./routes/settingsRoute.js";
import categoryRouter from "./routes/categoryRoute.js";

// Config dotenv
dotenv.config();

// App Config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cors());

// DB Connection
connectDB();

// API Endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/category", categoryRouter);

// Static assets endpoint for food images
app.use("/images", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("API Working Successfully");
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
