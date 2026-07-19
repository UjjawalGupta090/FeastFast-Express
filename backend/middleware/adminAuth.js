import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_key");
    
    // Check if the user is an admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied. Admins Only." });
    }

    req.body.userId = decoded.id;
    req.body.userRole = decoded.role;
    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Invalid Token. Access Denied." });
  }
};

export default adminAuth;
