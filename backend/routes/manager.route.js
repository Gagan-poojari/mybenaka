import express from "express";
import { isAuth, isManager } from "../middlewares/authorize.js";
import {
  getMyPortfolioStats,
  getMyOverdueLoans
} from "../controllers/loan.controller.js";

const managerRouter = express.Router();

// All routes require authentication and manager role
managerRouter.use(isAuth, isManager);

// Portfolio
managerRouter.get("/portfolio", getMyPortfolioStats);
managerRouter.get("/overdue", getMyOverdueLoans);

export default managerRouter;