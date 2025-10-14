import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";

const verifyToken = async (req, res, next) => {
  try {
    // Get token from cookies OR headers (more flexible)
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("🔵 Decoded token:", decoded);

    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    // Fetch user from database based on role
    let user;
    let role = decoded.role;

    if (role === "Admin") {
      user = await Admin.findById(userId).select("-password");
    } else if (role === "Manager") {
      user = await Manager.findById(userId).select("-password");
    } else {
      // If no role in token, try both (backward compatibility)
      user = await Admin.findById(userId).select("-password");
      role = "Admin";
      
      if (!user) {
        user = await Manager.findById(userId).select("-password");
        role = "Manager";
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User not found or deleted" });
    }

    // Store complete user data
    req.user = {
      id: user._id.toString(),
      role: role,
      email: user.email,
      name: user.name
    };
    
    // Also store individual fields for backward compatibility
    req.userId = user._id.toString();
    req.role = role;

    console.log("User authenticated:", req.user);
    
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default verifyToken;