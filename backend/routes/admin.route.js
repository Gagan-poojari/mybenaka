import express from "express";
import { isAuth, isAdmin } from "../middlewares/authorize.js";
import {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  createManager,
  getAllManagers,
  getManagerById,
  updateManager,
  deleteManager,
  getManagerPortfolio,
  getDashboardStats,
  getAllSystemLoans,
  getAllSystemBorrowers,
  getOverdueLoans,
  getCollectionReport,
  getRevenueReport,
  getActivityLogs
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

// All routes require authentication and admin role
adminRouter.use(isAuth, isAdmin);

// Profile Management
adminRouter.get("/profile", getAdminProfile);
adminRouter.put("/profile", updateAdminProfile);
adminRouter.put("/password", changeAdminPassword);

// Manager Management
adminRouter.post("/managers", createManager);
adminRouter.get("/managers", getAllManagers);
adminRouter.get("/managers/:id", getManagerById);
adminRouter.put("/managers/:id", updateManager);
adminRouter.delete("/managers/:id", deleteManager);
adminRouter.get("/managers/:id/portfolio", getManagerPortfolio);

// System Dashboard
adminRouter.get("/dashboard", getDashboardStats);
adminRouter.get("/mybenaka/loans", getAllSystemLoans);
adminRouter.get("/mybenaka/borrowers", getAllSystemBorrowers);

// Reports
adminRouter.get("/reports/overdue", getOverdueLoans);
adminRouter.get("/reports/collection", getCollectionReport);
adminRouter.get("/reports/revenue", getRevenueReport);
adminRouter.get("/activity-logs", getActivityLogs);

export default adminRouter;
