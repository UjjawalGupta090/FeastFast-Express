import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import settingsModel from "../models/settingsModel.js";
import Stripe from "stripe";
import { broadcastLiveUpdate } from "../utils/liveUpdates.js";

// Initialize Stripe (using local placeholder if key is missing)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key");

// Place user order for client frontend
const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    // Check if the store allows ordering based on current operational mode
    const settings = await settingsModel.findOne();
    if (settings) {
      const orderType = req.body.address?.type || "delivery";
      if (settings.orderMode === "offline") {
        return res.status(400).json({
          success: false,
          message: "The restaurant is currently offline and not accepting any orders."
        });
      }
      if (settings.orderMode === "online" && orderType === "dine-in") {
        return res.status(400).json({
          success: false,
          message: "We are currently only accepting home delivery orders. Dine-in orders are disabled."
        });
      }
      if (settings.orderMode === "dine-in" && orderType === "delivery") {
        return res.status(400).json({
          success: false,
          message: "We are currently only accepting dine-in orders. Home delivery orders are disabled."
        });
      }
    }

    const isCod = req.body.paymentMethod === "COD";

    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      payment: isCod ? false : true, // COD is unpaid initially; Online is directly marked true in dev bypass mode
      paymentMethod: isCod ? "COD" : "Online",
      notes: req.body.notes || ""
    });

    await newOrder.save();
    // Clear user cart after placing order
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    broadcastLiveUpdate("orderPlaced");

    res.json({ success: true, session_url: `${frontend_url}/myorders` });
  } catch (error) {
    console.error("Error in placeOrder:", error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};

// Verify user order payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      broadcastLiveUpdate("orderPlaced");
      res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment Cancelled or Failed" });
    }
  } catch (error) {
    console.error("Error in verifyOrder:", error);
    res.status(500).json({ success: false, message: "Error verifying payment" });
  }
};

// User orders for client page
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId }).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error in userOrders:", error);
    res.status(500).json({ success: false, message: "Error fetching user orders" });
  }
};

// List orders for admin dashboard
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error in listOrders:", error);
    res.status(500).json({ success: false, message: "Error listing admin orders" });
  }
};

// Update order status (Admin operation)
const updateStatus = async (req, res) => {
  const { orderId, status, adminNote } = req.body;
  try {
    const updateObj = { status };
    if (adminNote !== undefined) {
      updateObj.adminNote = adminNote;
    }
    await orderModel.findByIdAndUpdate(orderId, updateObj);
    broadcastLiveUpdate("orderUpdated");
    res.json({ success: true, message: "Order Status Updated" });
  } catch (error) {
    console.error("Error in updateStatus:", error);
    res.status(500).json({ success: false, message: "Error updating order status" });
  }
};

// Compile sales analytics statistics (Admin operation)
const getDashboardStats = async (req, res) => {
  try {
    // Restrict to Super Admin or Approved Admins
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }
    if (loggedInAdmin.email !== "admin@tomato.com" && loggedInAdmin.analyticalAccess !== "approved") {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have approved access to view analytical stats." });
    }

    // Only paid orders count towards sales statistics
    const orders = await orderModel.find({ payment: true });
    
    let totalSales = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let quarterlySales = 0;
    let yearlySales = 0;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneQuarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const itemSalesDict = {};

    orders.forEach((order) => {
      const amount = order.amount;
      const orderDate = new Date(order.date);

      totalSales += amount;
      if (orderDate >= oneWeekAgo) weeklySales += amount;
      if (orderDate >= oneMonthAgo) monthlySales += amount;
      if (orderDate >= oneQuarterAgo) quarterlySales += amount;
      if (orderDate >= oneYearAgo) yearlySales += amount;

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const name = item.name;
          const qty = item.quantity || 0;
          if (name) {
            itemSalesDict[name] = (itemSalesDict[name] || 0) + qty;
          }
        });
      }
    });

    // Map and sort top items
    const topItems = Object.keys(itemSalesDict)
      .map((name) => ({ name, quantity: itemSalesDict[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Build daily sales chart dataset for the last 7 days
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayRevenue = orders
        .filter((o) => {
          const od = new Date(o.date);
          return od >= d && od < nextD;
        })
        .reduce((sum, o) => sum + o.amount, 0);

      const label = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
      dailySales.push({ label, revenue: dayRevenue });
    }

    // Build calendar sales dataset mapping date to total revenue
    const calendarSales = {};
    orders.forEach((order) => {
      const orderDate = new Date(order.date);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, "0");
      const date = String(orderDate.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${date}`;
      calendarSales[dateKey] = (calendarSales[dateKey] || 0) + order.amount;
    });

    res.json({
      success: true,
      data: {
        totalSales,
        weeklySales,
        monthlySales,
        quarterlySales,
        yearlySales,
        topItems,
        dailySales,
        calendarSales
      }
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ success: false, message: "Error compiling dashboard statistics" });
  }
};

// Cancel order by customer
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Security check: ensure user is the owner of the order
    if (order.userId !== req.body.userId) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
    }

    // Check if order is cancelable (only if status is "Placed")
    if (order.status !== "Placed") {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled as it is already " + order.status });
    }

    order.status = "Cancelled";
    await order.save();

    broadcastLiveUpdate("orderUpdated");

    res.json({ success: true, message: "Order cancelled successfully!" });
  } catch (error) {
    console.error("Error in cancelOrder:", error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus, getDashboardStats, cancelOrder };
