import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRouter from "./routes/auth.route.js";
import adminRouter from "./routes/admin.route.js";
import managerRouter from "./routes/manager.route.js";
import loanRouter from "./routes/loan.route.js";
import logsRouter from "./routes/log.route.js";

// Utils 
import { seedAdmin } from "./utils/seedAdmin.js";
import { startOverdueLoanChecker } from "./utils/cronJobs.js";


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3001" || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/manager", managerRouter);
app.use("/api", loanRouter); 
app.use("/api/logs", logsRouter); 

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "Loan Management API", 
    status: "Running",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
  });
});

// Database connection and server startup
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    
    // Seed admin if not exists
    await seedAdmin();
    
    // Start cron jobs
    startOverdueLoanChecker();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
      console.log(`👑 Admin email: ${process.env.ADMIN_EMAIL}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed");
  process.exit(0);
});