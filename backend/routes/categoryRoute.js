import express from "express";
import { addCategory, listCategories, removeCategory } from "../controllers/categoryController.js";
import adminAuth from "../middleware/adminAuth.js";
import multer from "multer";

const categoryRouter = express.Router();

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

categoryRouter.post("/add", adminAuth, upload.single("image"), addCategory);
categoryRouter.get("/list", listCategories);
categoryRouter.post("/remove", adminAuth, removeCategory);

export default categoryRouter;
