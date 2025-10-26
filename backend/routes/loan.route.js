import express from "express";
import { isAdmin, isAuth } from "../middlewares/authorize.js";
import {
  addBorrower,
  getMyBorrowers,
  getBorrowerById,
  updateBorrower,
  deleteBorrower,
  issueLoan,
  getMyLoans,
  getLoanById,
  recordPayment,
  updateLoan,
  getMyPortfolioStats, 
  getMyOverdueLoans,
  deleteLoan,
  getPaymentRecords,
  getLast24hrPayments,
  whoHasToPayToday,
//   getLoanHistory,
//   addLoanNote,
//   applyLateFee,
//   applyWaiver,
//   transferLoan
} from "../controllers/loan.controller.js";

const loanRouter = express.Router();

// All routes require authentication (works for both Admin & Manager)
loanRouter.use(isAuth);

// Borrower Routes
loanRouter.post("/borrowers", addBorrower);
loanRouter.get("/borrowers", getMyBorrowers);
loanRouter.get("/borrowers/:id", getBorrowerById);
loanRouter.put("/borrowers/:id", updateBorrower);
loanRouter.delete("/borrowers/:id", deleteBorrower);

// Loan Routes
loanRouter.post("/loans", issueLoan);
loanRouter.get("/loans", getMyLoans);
loanRouter.get("/loans/:id", getLoanById);
loanRouter.put("/loans/:id", updateLoan);
loanRouter.delete("/loans/:id", isAdmin, deleteLoan);

// Payment Routes
loanRouter.post("/loans/record-payment/:loanId", recordPayment); // id identifies the loan
loanRouter.get("/loans/:id/payments", getPaymentRecords);

loanRouter.get("/loans/payments/24hrs", getLast24hrPayments);
loanRouter.get("/loans/due/today", whoHasToPayToday)

// Loan Stats
loanRouter.get("/stats", getMyPortfolioStats);
loanRouter.get("/overdue-loans", getMyOverdueLoans);

// Loan History & Notes
// loanRouter.get("/loans/:id/history", getLoanHistory);
// loanRouter.post("/loans/:id/notes", addLoanNote);

// Loan Actions
// loanRouter.post("/loans/:id/late-fee", applyLateFee);
// loanRouter.post("/loans/:id/waiver", applyWaiver);
// loanRouter.post("/loans/:id/transfer", transferLoan);

export default loanRouter;
