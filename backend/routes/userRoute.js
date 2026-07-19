import express from "express";
import { 
  loginUser, 
  registerUser, 
  addAdminUser, 
  listAdmins, 
  getUserAddresses, 
  addUserAddress, 
  removeUserAddress,
  setDefaultUserAddress,
  listUsers,
  toggleBlockUser,
  removeAdmin,
  changeAdminPassword,
  getAdminStatus,
  requestAnalyticalAccess,
  manageAnalyticalAccess,
  googleLogin
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const userRouter = express.Router();

// General authentication paths
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-login", googleLogin);

// Admin-exclusive user creation paths
userRouter.post("/add-admin", adminAuth, addAdminUser);
userRouter.get("/list-admins", adminAuth, listAdmins);
userRouter.get("/list-users", adminAuth, listUsers);
userRouter.post("/toggle-block", adminAuth, toggleBlockUser);
userRouter.post("/remove-admin", adminAuth, removeAdmin);
userRouter.post("/change-admin-password", adminAuth, changeAdminPassword);
userRouter.post("/status", adminAuth, getAdminStatus);
userRouter.post("/request-analytical-access", adminAuth, requestAnalyticalAccess);
userRouter.post("/manage-analytical-access", adminAuth, manageAnalyticalAccess);

// Client Saved Address paths
userRouter.get("/addresses", authMiddleware, getUserAddresses);
userRouter.post("/address/add", authMiddleware, addUserAddress);
userRouter.post("/address/remove", authMiddleware, removeUserAddress);
userRouter.post("/address/set-default", authMiddleware, setDefaultUserAddress);

export default userRouter;
