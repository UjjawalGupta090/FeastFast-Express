import cashLogModel from "../models/cashLogModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { broadcastLiveUpdate } from "../utils/liveUpdates.js";

const getDailySalesTracker = async (req, res) => {
  try {
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    const now = new Date();
    // Today's local date string YYYY-MM-DD
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    const todayStr = localNow.toISOString().split("T")[0];

    // Fetch today's online paid orders
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayOrders = await orderModel.find({
      payment: true,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayOnlineSales = todayOrders.reduce((sum, o) => sum + o.amount, 0);

    // Fetch today's cash log
    let todayCashLog = await cashLogModel.findOne({ date: todayStr });
    const todayCashSales = todayCashLog ? todayCashLog.cashAmount : 0;

    // Fetch last 7 days of logs (both online and cash) to show history
    const recentTracker = [];
    for (let i = 0; i <= 6; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const localD = new Date(d.getTime() - (offset * 60 * 1000));
      const dateStr = localD.toISOString().split("T")[0];

      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const dayOrders = await orderModel.find({
        payment: true,
        date: { $gte: start, $lte: end }
      });
      const onlineSales = dayOrders.reduce((sum, o) => sum + o.amount, 0);

      const cashLog = await cashLogModel.findOne({ date: dateStr });
      const cashSales = cashLog ? cashLog.cashAmount : 0;

      recentTracker.push({
        date: dateStr,
        displayDate: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        onlineSales,
        cashSales,
        totalSales: onlineSales + cashSales
      });
    }

    res.json({
      success: true,
      todayOnlineSales,
      todayCashSales,
      todayStr,
      recentTracker
    });
  } catch (error) {
    console.error("Error in getDailySalesTracker:", error);
    res.status(500).json({ success: false, message: "Error compiling daily tracker stats" });
  }
};

const logDailyCash = async (req, res) => {
  const { date, cashAmount } = req.body;
  try {
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    let cashLog = await cashLogModel.findOne({ date });
    if (cashLog) {
      cashLog.cashAmount = Number(cashAmount);
      cashLog.recordedBy = loggedInAdmin.email;
      await cashLog.save();
    } else {
      cashLog = new cashLogModel({
        date,
        cashAmount: Number(cashAmount),
        recordedBy: loggedInAdmin.email
      });
      await cashLog.save();
    }
    
    broadcastLiveUpdate("cashUpdated");

    res.json({ success: true, message: "Cash logged successfully!", data: cashLog });
  } catch (error) {
    console.error("Error in logDailyCash:", error);
    res.status(500).json({ success: false, message: "Error saving daily cash log" });
  }
};

export { getDailySalesTracker, logDailyCash };
