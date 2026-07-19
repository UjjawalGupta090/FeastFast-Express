import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";

// Helper function to create JWT token containing id and role
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "super_secret_key", {
    expiresIn: "30d"
  });
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User doesn't exist" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been suspended by an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id, user.role);
    res.json({ success: true, token, role: user.role, name: user.name });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ success: false, message: "Error authenticating user" });
  }
};

// Register user (Storefront customer registrations - defaults to "customer")
const registerUser = async (req, res) => {
  const { name, password, email } = req.body;
  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Please enter a strong password (min 8 characters)" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Secure default role: Customer (No automatic promotion via email prefix)
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "customer"
    });

    const user = await newUser.save();
    const token = createToken(user._id, user.role);
    res.status(201).json({ success: true, token, role: user.role, name: user.name });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ success: false, message: "Error registering user" });
  }
};

// Create a new Administrator (Restricted to logged-in admins via adminAuth)
const addAdminUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Restrict to Super Admin (admin@tomato.com)
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin || loggedInAdmin.email !== "admin@tomato.com") {
      return res.status(403).json({ success: false, message: "Action Denied: Only the Super Admin is authorized to add administrators." });
    }

    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "User email is already registered." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    await newAdmin.save();
    res.status(201).json({ success: true, message: "New Administrator created successfully!" });
  } catch (error) {
    console.error("Error in addAdminUser:", error);
    res.status(500).json({ success: false, message: "Failed to create administrator account." });
  }
};

// List all administrators (Restricted to admins)
const listAdmins = async (req, res) => {
  try {
    const admins = await userModel.find({ role: "admin" }, { password: 0 }); // Exclude password hashes
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error("Error in listAdmins:", error);
    res.status(500).json({ success: false, message: "Error fetching administrators list." });
  }
};

// --- Address Management Controllers (Secured via customer authMiddleware) ---

// Get saved user addresses
const getUserAddresses = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.addresses || [] });
  } catch (error) {
    console.error("Error in getUserAddresses:", error);
    res.status(500).json({ success: false, message: "Error fetching delivery addresses" });
  }
};

// Add new delivery address
const addUserAddress = async (req, res) => {
  try {
    const { address, isDefault } = req.body;
    if (!address) return res.status(400).json({ success: false, message: "Address details are required" });

    address.id = Date.now().toString();
    address.isDefault = !!isDefault;

    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let updatedAddresses = [...(user.addresses || [])];
    if (isDefault) {
      // Clear default flag on existing addresses
      updatedAddresses = updatedAddresses.map((addr) => ({ ...addr, isDefault: false }));
    } else if (updatedAddresses.length === 0) {
      // First address defaults to true
      address.isDefault = true;
    }

    updatedAddresses.push(address);

    await userModel.findByIdAndUpdate(req.body.userId, { addresses: updatedAddresses });
    res.json({ success: true, message: "Address saved successfully!", data: address });
  } catch (error) {
    console.error("Error in addUserAddress:", error);
    res.status(500).json({ success: false, message: "Failed to save delivery address" });
  }
};

// Set default address
const setDefaultUserAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    if (!addressId) return res.status(400).json({ success: false, message: "Address ID is required" });

    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const updatedAddresses = (user.addresses || []).map((addr) => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    await userModel.findByIdAndUpdate(req.body.userId, { addresses: updatedAddresses });
    res.json({ success: true, message: "Default address set successfully!" });
  } catch (error) {
    console.error("Error in setDefaultUserAddress:", error);
    res.status(500).json({ success: false, message: "Failed to update default address" });
  }
};

// Remove delivery address
const removeUserAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    if (!addressId) return res.status(400).json({ success: false, message: "Address ID is required" });

    await userModel.findByIdAndUpdate(req.body.userId, {
      $pull: { addresses: { id: addressId } }
    });

    res.json({ success: true, message: "Address removed successfully!" });
  } catch (error) {
    console.error("Error in removeUserAddress:", error);
    res.status(500).json({ success: false, message: "Failed to remove delivery address" });
  }
};

// List all customer users (Restricted to admins)
const listUsers = async (req, res) => {
  try {
    const users = await userModel.find({ role: "customer" }, { password: 0 }); // Exclude password hashes
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error in listUsers:", error);
    res.status(500).json({ success: false, message: "Error fetching user list." });
  }
};

// Toggle user block status (Restricted to admins)
const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    
    // Admins cannot block other admins from here
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Action Denied: Cannot block administrators." });
    }

    user.isBlocked = user.isBlocked === true ? false : true;
    await user.save();
    
    res.json({ success: true, message: `User account is now ${user.isBlocked ? "Blocked" : "Unblocked"}.`, isBlocked: user.isBlocked });
  } catch (error) {
    console.error("Error in toggleBlockUser:", error);
    res.status(500).json({ success: false, message: "Failed to update user block status." });
  }
};

// Remove an administrator (Restricted to logged-in admins via adminAuth)
const removeAdmin = async (req, res) => {
  try {
    // Restrict to Super Admin (admin@tomato.com)
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin || loggedInAdmin.email !== "admin@tomato.com") {
      return res.status(403).json({ success: false, message: "Action Denied: Only the Super Admin is authorized to remove administrators." });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Admin ID is required." });
    }

    // Prevent self-deletion
    if (id === req.body.userId) {
      return res.status(400).json({ success: false, message: "Action Denied: You cannot delete your own account." });
    }

    const admin = await userModel.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Administrator account not found." });
    }

    if (admin.role !== "admin") {
      return res.status(400).json({ success: false, message: "Target user is not an administrator." });
    }

    await userModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Administrator account removed successfully!" });
  } catch (error) {
    console.error("Error in removeAdmin:", error);
    res.status(500).json({ success: false, message: "Failed to remove administrator." });
  }
};

// Change administrator password (Restricted to logged-in admins via adminAuth)
const changeAdminPassword = async (req, res) => {
  try {
    // Restrict to Super Admin (admin@tomato.com)
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin || loggedInAdmin.email !== "admin@tomato.com") {
      return res.status(403).json({ success: false, message: "Action Denied: Only the Super Admin is authorized to modify administrator passwords." });
    }

    const { id, newPassword } = req.body;
    if (!id || !newPassword) {
      return res.status(400).json({ success: false, message: "Admin ID and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const admin = await userModel.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Administrator account not found." });
    }

    if (admin.role !== "admin") {
      return res.status(400).json({ success: false, message: "Target user is not an administrator." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    await admin.save();

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error in changeAdminPassword:", error);
    res.status(500).json({ success: false, message: "Failed to update password." });
  }
};

// Check admin profile details and active analytical status
const getAdminStatus = async (req, res) => {
  try {
    const admin = await userModel.findById(req.body.userId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({
      success: true,
      role: admin.role,
      email: admin.email,
      name: admin.name,
      analyticalAccess: admin.email === "admin@tomato.com" ? "approved" : (admin.analyticalAccess || "none")
    });
  } catch (error) {
    console.error("Error in getAdminStatus:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve status." });
  }
};

// Regular admin requests analytical access
const requestAnalyticalAccess = async (req, res) => {
  try {
    const admin = await userModel.findById(req.body.userId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Action Denied: Only administrators can request analytical access." });
    }

    admin.analyticalAccess = "pending";
    await admin.save();

    res.json({ success: true, message: "Access request submitted to Super Admin successfully!" });
  } catch (error) {
    console.error("Error in requestAnalyticalAccess:", error);
    res.status(500).json({ success: false, message: "Failed to submit access request." });
  }
};

// Super admin manages access requests
const manageAnalyticalAccess = async (req, res) => {
  try {
    // Restrict to Super Admin (admin@tomato.com)
    const loggedInAdmin = await userModel.findById(req.body.userId);
    if (!loggedInAdmin || loggedInAdmin.email !== "admin@tomato.com") {
      return res.status(403).json({ success: false, message: "Action Denied: Only the Super Admin is authorized to manage analytics access." });
    }

    const { targetAdminId, action } = req.body;
    if (!targetAdminId || !action) {
      return res.status(400).json({ success: false, message: "Target Admin ID and action are required." });
    }

    const targetAdmin = await userModel.findById(targetAdminId);
    if (!targetAdmin || targetAdmin.role !== "admin") {
      return res.status(404).json({ success: false, message: "Target administrator account not found." });
    }

    if (action === "approve") {
      targetAdmin.analyticalAccess = "approved";
    } else if (action === "reject") {
      targetAdmin.analyticalAccess = "rejected";
    } else if (action === "revoke") {
      targetAdmin.analyticalAccess = "none";
    } else if (action === "grant") {
      targetAdmin.analyticalAccess = "approved";
    } else {
      return res.status(400).json({ success: false, message: "Invalid action. Use approve, reject, revoke, or grant." });
    }

    await targetAdmin.save();
    res.json({ success: true, message: `Access ${action}d successfully!`, data: targetAdmin });
  } catch (error) {
    console.error("Error in manageAnalyticalAccess:", error);
    res.status(500).json({ success: false, message: "Failed to update analytical access." });
  }
};

// Google Auth Login
const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    if (!credential) {
      return res.status(400).json({ success: false, message: "Credential token is required" });
    }

    // Call Google's tokeninfo API via native fetch
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await verifyResponse.json();

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: "Invalid or expired Google token" });
    }

    const { email, name } = payload;

    // Check if user already exists in MDB
    let user = await userModel.findOne({ email });

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: "Your account has been suspended by an administrator." });
      }
    } else {
      // Create new customer record
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2, 15), salt);

      const newUser = new userModel({
        name: name || "Google User",
        email,
        password: hashedPassword,
        role: "customer"
      });
      user = await newUser.save();
    }

    const token = createToken(user._id, user.role);
    res.json({ success: true, token, role: user.role, name: user.name });

  } catch (error) {
    console.error("Error in googleLogin:", error);
    res.status(500).json({ success: false, message: "Google authentication failed" });
  }
};

export { 
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
};
