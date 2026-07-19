import express from "express";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, getDashboardStats, cancelOrder } from "../controllers/orderController.js";
import { getDailySalesTracker, logDailyCash } from "../controllers/cashLogController.js";
import { subscribeLiveUpdates } from "../utils/liveUpdates.js";

const orderRouter = express.Router();

// User client orders routes
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/cancel", authMiddleware, cancelOrder);

// Admin dashboard orders routes (Secured via adminAuth middleware)
orderRouter.get("/list", adminAuth, listOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.get("/dashboard-stats", adminAuth, getDashboardStats);
orderRouter.get("/daily-sales-tracker", adminAuth, getDailySalesTracker);
orderRouter.post("/log-cash", adminAuth, logDailyCash);
orderRouter.get("/live-updates", subscribeLiveUpdates);

export default orderRouter;
