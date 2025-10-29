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
  getAllLoans,
  editRecordedPayment,
  deleteRecordedPayment,
  getAllBorrowers,
  applyMissedPaymentLateFee,
  applyOverduePenalty,
  autoApplyLateFees,
  waiveLateFee,
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
loanRouter.get("/borrowers", getAllBorrowers);
loanRouter.get("/borrowers/:id", getBorrowerById);
loanRouter.put("/borrowers/:id", updateBorrower);
loanRouter.delete("/borrowers/:id", deleteBorrower);

// Loan Routes
loanRouter.post("/loans", issueLoan);
loanRouter.get("/loans", getAllLoans);
loanRouter.get("/loans/:id", getLoanById);
loanRouter.put("/loans/:id", updateLoan);
loanRouter.delete("/loans/:id", isAdmin, deleteLoan);

// Payment Routes
loanRouter.post("/loans/record-payment/:loanId", recordPayment);
loanRouter.put("/loans/record-payment/:loanId/:paymentId", editRecordedPayment);
loanRouter.delete("/loans/record-payment/:loanId/:paymentId", deleteRecordedPayment); 
loanRouter.get("/loans/:id/payments", getPaymentRecords);

loanRouter.get("/loans/payments/24hrs", getLast24hrPayments);
loanRouter.get("/loans/due/today", whoHasToPayToday)

// Loan Stats
loanRouter.get("/stats", getMyPortfolioStats);
loanRouter.get("/overdue-loans", getMyOverdueLoans);

// Late fee routes
loanRouter.post("/loans/:loanId/late-fee/missed-payment", applyMissedPaymentLateFee);
loanRouter.post("/loans/:loanId/late-fee/overdue-penalty", applyOverduePenalty);
loanRouter.post("/late-fees/auto-apply", isAdmin, autoApplyLateFees);
loanRouter.post("/loans/:loanId/late-fee/:lateFeeId/waive", waiveLateFee);


// Loan History & Notes
// loanRouter.get("/loans/:id/history", getLoanHistory);
// loanRouter.post("/loans/:id/notes", addLoanNote);

// Loan Actions
// loanRouter.post("/loans/:id/late-fee", applyLateFee);
// loanRouter.post("/loans/:id/waiver", applyWaiver);
// loanRouter.post("/loans/:id/transfer", transferLoan);

export default loanRouter;
