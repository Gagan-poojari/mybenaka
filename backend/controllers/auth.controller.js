import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";
import generateToken from "../utils/generateToken.js";

// Login (works for both Admin and Manager)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user is Admin
    let user = await Admin.findOne({ email });
    let role = "Admin";

    // If not Admin, check if Manager
    if (!user) {
      user = await Manager.findOne({ email });
      role = "Manager";
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
      // return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
      // return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken({ id: user._id, role });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: { ...userResponse, role }
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get current user (works for both Admin and Manager)
export const getCurrentUser = async (req, res) => {
  try {
    const Model = req.user.role === "Admin" ? Admin : Manager;
    const user = await Model.findById(req.user.id)
      .select("-password")
      .populate("borrowers", "name phone")
      .populate("loanIssued");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ ...user.toObject(), role: req.user.role });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// Logout (optional - mainly for frontend to clear token)
export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error: error.message });
  }
};