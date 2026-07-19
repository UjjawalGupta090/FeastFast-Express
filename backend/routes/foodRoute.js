import express from "express";
import { addFood, listFood, removeFood, getRecommendations, toggleStockFood } from "../controllers/foodController.js";
import adminAuth from "../middleware/adminAuth.js";
import multer from "multer";

const foodRouter = express.Router();

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Routes (Protected admin operations)
foodRouter.post("/add", adminAuth, upload.single("image"), addFood);
foodRouter.get("/list", listFood);
foodRouter.post("/remove", adminAuth, removeFood);
foodRouter.post("/toggle-stock", adminAuth, toggleStockFood);
foodRouter.get("/recommendations", getRecommendations);

export default foodRouter;
