import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";

export const isAuth = async (req, res, next) => {
  try {
    
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = await Admin.findById(decoded.id).select("-password");
    let role = "Admin";
    
    if (!user) {
      user = await Manager.findById(decoded.id).select("-password");
      role = "Manager";
    }
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = {
      id: user._id.toString(),
      role: role,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

export const isManager = (req, res, next) => {
  if (req.user.role !== "Manager") {
    return res.status(403).json({ message: "Access denied. Manager only." });
  }
  next();
};