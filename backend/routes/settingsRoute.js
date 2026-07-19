import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import adminAuth from "../middleware/adminAuth.js";

const settingsRouter = express.Router();

// Get settings is public (needed by customer frontend as well)
settingsRouter.get("/", getSettings);

// Update settings is restricted to admins
settingsRouter.post("/update", adminAuth, updateSettings);

export default settingsRouter;
