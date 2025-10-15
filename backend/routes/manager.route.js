import express from "express";
import { isAuth, isManager } from "../middlewares/authorize.js";
import { getManagerActivityLogs, 
  getManagerBorrowers, 
  getManagerBorrowersById, 
  getManagerCollections, 
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

managerRouter.get("/portfolio-stats", getManagerPortfolioStats);
managerRouter.get("/overdue-loans", getManagerOverdueLoans)

managerRouter.get("/borrowers", getManagerBorrowers)
managerRouter.get("/borrowers/:id", getManagerBorrowersById)

// managerRouter.get("/loans", getManagerIssuedLoans)
// managerRouter.get("/loans/:id", getManagerIssuedLoansById)

managerRouter.get("/loan-collections", getManagerCollections)

managerRouter.get("/activity-logs", getManagerActivityLogs)

export default managerRouter;