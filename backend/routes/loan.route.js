// import express from "express";
// import { isAuth } from "../middlewares/authorize.js";
// import {
//   addBorrower,
//   getMyBorrowers,
//   getBorrowerById,
//   updateBorrower,
//   deleteBorrower,
//   issueLoan,
//   getMyLoans,
//   getLoanById,
//   updateLoan,
//   getLoanHistory,
//   addLoanNote,
//   applyLateFee,
//   applyWaiver,
//   transferLoan
// } from "../controllers/loan.controller.js";

// const loanRouter = express.Router();

// // All routes require authentication (works for both Admin & Manager)
// loanRouter.use(isAuth);

// // Borrower Routes
// loanRouter.post("/borrowers", addBorrower);
// loanRouter.get("/borrowers", getMyBorrowers);
// loanRouter.get("/borrowers/:id", getBorrowerById);
// loanRouter.put("/borrowers/:id", updateBorrower);
// loanRouter.delete("/borrowers/:id", deleteBorrower);

// // Loan Routes
// loanRouter.post("/loans", issueLoan);
// loanRouter.get("/loans", getMyLoans);
// loanRouter.get("/loans/:id", getLoanById);
// loanRouter.put("/loans/:id", updateLoan);

// // Loan History & Notes
// loanRouter.get("/loans/:id/history", getLoanHistory);
// loanRouter.post("/loans/:id/notes", addLoanNote);

// // Loan Actions
// loanRouter.post("/loans/:id/late-fee", applyLateFee);
// loanRouter.post("/loans/:id/waiver", applyWaiver);
// loanRouter.post("/loans/:id/transfer", transferLoan);

// export default loanRouter;
