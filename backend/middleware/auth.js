import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET || "super_secret_key");
    
    // Check if user is blocked
    const user = await userModel.findById(token_decode.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Access Denied: Your account has been suspended by an administrator." });
    }

    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ success: false, message: "Invalid Token. Login Again." });
  }
};

export default authMiddleware;
