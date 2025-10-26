// routes/logsRoutes.js
import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { isAdmin, isAuth } from "../middlewares/authorize.js";
import {
  getMyActivityLogs,
  getMyCollectionLogs,
  getAllActivityLogs,
  getAllCollectionLogs,
  getBorrowerLogs,
  getLoanLogs,
  getActivitySummary,
  getCollectionSummary
} from "../controllers/log.controller.js";

const logsRouter = express.Router();

logsRouter.use(verifyToken);

// ============ SHARED ROUTES (Admin & Manager) ============

// My Activity Logs
logsRouter.get('/myactivity', isAuth, getMyActivityLogs);

// My Collection Logs
logsRouter.get('/mycollections', isAuth, getMyCollectionLogs);

// Activity Summary
logsRouter.get('/activity/summary', isAuth, getActivitySummary);

// Collection Summary
logsRouter.get('/collection/summary', isAuth, getCollectionSummary);

// Borrower Logs (with access control)
logsRouter.get('/borrower/:borrowerId', isAuth, getBorrowerLogs);

// Loan Logs (with access control)
logsRouter.get('/loan/:loanId', isAuth, getLoanLogs);

// ============ ADMIN-ONLY ROUTES ============

// All Activity Logs (system-wide)
logsRouter.get('/activity/all', isAuth, getAllActivityLogs);

// All Collection Logs (system-wide)
logsRouter.get('/collection/all', isAuth, getAllCollectionLogs);

export default logsRouter;