import express from "express";
import { isAuth, isManager } from "../middlewares/authorize.js";
import {
  getDashboardStatsManager,
  getManagerBorrowers, 
  getManagerBorrowersById, 
  getManagerIssuedLoans, 
  getManagerIssuedLoansById, 
  getManagerOverdueLoans, 
  getManagerPortfolioStats, 
  getManagerProfile, 
} from "../controllers/manager.controller.js";
const managerRouter = express.Router();

// All routes require authentication and manager role
managerRouter.use(isAuth, isManager);

managerRouter.get("/profile", getManagerProfile);

// Dashboard
managerRouter.get("/dashboard", getDashboardStatsManager);


managerRouter.get("/portfolio-stats", getManagerPortfolioStats);
managerRouter.get("/overdue-loans", getManagerOverdueLoans)

managerRouter.get("/borrowers", getManagerBorrowers)
managerRouter.get("/borrowers/:id", getManagerBorrowersById)

managerRouter.get("/loans", getManagerIssuedLoans)
managerRouter.get("/loans/:id", getManagerIssuedLoansById)


export default managerRouter;