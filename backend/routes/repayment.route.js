// import express from "express";
// import { isAuth, isAdmin } from "../middlewares/authorize.js";
// import {
//   recordPayment,
//   getLoanPayments,
//   getMyCollections,
//   updatePayment,
//   deletePayment,
//   getPaymentByReceipt,
//   issueReceipt
// } from "../controllers/repayment.controller.js";

// const repaymentRouter = express.Router();

// // All routes require authentication
// repaymentRouter.use(isAuth);

// // Record payment (both Admin & Manager)
// repaymentRouter.post("/", recordPayment);

// // Get all payments for a specific loan
// repaymentRouter.get("/loan/:loanId", getLoanPayments);

// // Get my collections (payments I received)
// repaymentRouter.get("/my-collections", getMyCollections);

// // Get payment by receipt number
// repaymentRouter.get("/receipt/:receiptNumber", getPaymentByReceipt);

// // Update payment
// repaymentRouter.put("/:paymentId", updatePayment);

// // Issue receipt
// repaymentRouter.post("/:paymentId/issue-receipt", issueReceipt);

// // Delete payment (Admin only)
// repaymentRouter.delete("/:paymentId", isAdmin, deletePayment);

// export default repaymentRouter;