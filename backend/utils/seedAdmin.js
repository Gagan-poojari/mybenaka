import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await Admin.create({
      name: "Super Admin",
      email: process.env.ADMIN_EMAIL,
      photo: "",
      password: hashedPassword,
      contacts: []
    });

    console.log("Admin account created successfully");
    console.log(`Email: ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

// Run directly if executed as script
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("MongoDB connected");
      await seedAdmin();
      process.exit(0);
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}
