import bcrypt from "bcryptjs";
import Repayment from "../models/repayment.model";
import Loan from "../models/loan.model";
import Borrower from "../models/borrower.model";
import Admin from "../models/admin.model";
import Manager from "../models/manager.model";

export const recordPayment = async (req, res) => {
    try {
        const {
            loanId,
            borrowerId,
            amount,
            date,
            transactionId,
            // paymentMethod,
            // chequeNumber,
            // bankName,
            // upiId,
            notes,
            collectionLocation,
            principalAmount,
            interestAmount,
            lateFeeAmount
        } = req.body;
        if (!loanId || !borrowerId || !amount || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const loan = await Loan.findById(loanId).populate("borrower", "name phone");
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied, You can only record payments for your own borrowers" });
        }
        if (loan.borrower._id.toString() !== borrowerId) {
            return res.status(403).json({ message: "Loan does not belong to this borrower" });
        }

        const repayment = await Repayment.create({
            loan: loanId,
            borrower: borrowerId,
            amount,
            date: new Date(date),
            receivedBy: req.user.id,
            receivedByRole: req.user.role,
            paymentMethod: "cash",
            transactionId,
            // chequeNumber,
            // bankName,
            // upiId,
            notes,
            collectionLocation,
            principalAmount,
            interestAmount,
            lateFeeAmount,
            ipaddress: req.ip,
            userAgent: req.get("user-Agent")
        });

        // update loan's repayments array and payment summary
        await loan.updateOne({ $push: { repayments: repayment._id } });

        if (!loan.paymentSummary) {
            loan.paymentSummary = {
                totalPaid: 0,
                paymentCount: 0
            };
        }
        loan.paymentSummary.totalPaid = (loan.paymentSummary.totalPaid || 0) + amount;
        loan.paymentSummary.lastPaymentDate = new Date(date);
        loan.paymentSummary.lastPaymentAmount = amount;
        loan.paymentSummary.paymentCount = (loan.paymentSummary.paymentCount || 0) + 1;

        // Add to loan history
        if (!loan.history) {
            loan.history = [];
        }

        loan.history.push({
            action: "PAYMENT_RECIEVED",
            performedBy: req.user.id,
            performedByRole: req.user.role,
            details: `Payment of ${amount} received on ${date} by ${req.user.name} via cash`,
            metadata: {
                amount,
                paymentMethod: "cash",
                receiptNumber: repayment.receiptNumber
            },
            relatedRepayment: repayment._id,
            timestamp: new Date()
        })

        const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);

        if (loan.status === "active" && loan.paymentSummary.totalPaid >= totalDue) {
            loan.status = "closed";
            loan.history.push({
                action: "STATUS_CHANGED",
                performedBy: req.user.id,
                performedByRole: req.user.role,
                details: "Loan marked as closed - fully paid",
                metadata: {
                    oldStatus: loan.status,
                    newStatus: "closed"
                },
                timestamp: new Date()
            });
        } else if (loan.status === "overdue" && loan.paymentSummary.totalPaid >= totalDue) {
            loan.status = "active";
            loan.history.push({
                action: "STATUS_CHANGED",
                performedBy: req.user.id,
                performedByRole: req.user.role,
                details: "Loan status changed from overdue to active after payment",
                metadata: {
                    oldStatus: "overdue",
                    newStatus: "active"
                },
                timestamp: new Date()
            });
        }

        await loan.save();

        // log activity
        const Model = req.user.role === 'Admin' ? Admin: Manager;
        await Model.findByIdAndUpdate(req.user.id, {
            $push: {
                activityLogs: {
                    action: "RECORD_PAYMENT",
                    details: `Payment of ${amount} received on ${date} by ${req.user.name} via cash`,
                }
            }
        })

        const populatedPayment = await Repayment.findById(repayment._id)
        .populate("receivedBy", "name email")
        .populate("loan", "amount status")
        .populate("borrower", "name phone")

        res.status(201).json({
            message: "Repayment recorded successfully",
            repayment: populatedPayment,
            loan: {
                _id: loan._id,
                status: loan.status,
                outstanding: totalDue - loan.paymentSummary.totalPaid,
                amount: loan.paymentSummary.totalPaid
            }
        })

    } catch (error) {
        res.status(500).json({ message: "Error recording repayment", error: error.message });
    }
}

export const getLoanPayments = async (req, res) => {
    try {
        const { loanId } = req.params;

        const loan = await loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        // check access
        if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const payments = await Repayment.find({ loan: loanId })
        .populate("receivedBy", "name email")
        .populate("borrower", "name phone")
        .sort({ date: -1 })

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

        res.status(200).json({
            loanId,
            totalPayments: payments.length,
            totalPaid,
            payments
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching loan payments", error: error.message });
    }
}

export const getMyCollections = async (req, res) => {
    try {
        const { startDate, endDate, status, paymentMethod } = req.query

        let query = { receivedBy: req.user.id }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        } 
        if (status) query.status = status
        if (paymentMethod) query.paymentMethod = paymentMethod

        const payments = await Repayment.find(query)
        .populate("loan", "amount status")
        .populate("borrower", "name phone")
        .sort({ date: -1 })

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)

        const byMethod = {}
        payments.forEach(p => {
            const method = "cash"
            if (!byMethod[method]) {
                byMethod[method] = { amount: 0, count: 0 }
            }
            byMethod[method].amount += p.amount
            byMethod[method].count += 1
        })
        
        // group by status
        const byStatus = {}
        payments.forEach(p => {
            const stat = p.status || "cleared"
            if (!byStatus[stat]) {
                byStatus[stat] = { amount: 0, count: 0 }
            }
            byStatus[stat].amount += p.amount
            byStatus[stat].count += 1
        })

        res.status(200).json({
            totalCollected, 
            paymentCount: payments.length,
            byMethod,
            byStatus,
            payments
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching loan payments", error: error.message });
    }
}

// export const updatePayment = async (req, res) => {
//   try {
//     const { paymentId } = req.params;
//     const { amount, notes, date } = req.body;

//     const payment = await Repayment.findById(paymentId)
//       .populate("loan")
//       .populate("receivedBy", "name");

//     if (!payment) {
//       return res.status(404).json({ message: "Payment not found" });
//     }

//     // Only admin or the person who received it can update
//     if (req.user.role === "Manager" && payment.receivedBy._id.toString() !== req.user.id) {
//       return res.status(403).json({ message: "Access denied. You can only update your own payments." });
//     }

//     // Track modifications
//     const modifications = [];
    
//     if (amount && amount !== payment.amount) {
//       modifications.push({
//         modifiedBy: req.user.id,
//         modifiedByRole: req.user.role,
//         fieldChanged: "amount",
//         oldValue: payment.amount,
//         newValue: amount,
//         modifiedAt: new Date()
//       });
      
//       // Update loan payment summary
//       const loan = await Loan.findById(payment.loan._id);
//       const difference = amount - payment.amount;
//       loan.paymentSummary.totalPaid = (loan.paymentSummary.totalPaid || 0) + difference;
//       await loan.save();
      
//       payment.amount = amount;
//     }

//     if (date && new Date(date).getTime() !== new Date(payment.date).getTime()) {
//       modifications.push({
//         modifiedBy: req.user.id,
//         modifiedByRole: req.user.role,
//         fieldChanged: "date",
//         oldValue: payment.date,
//         newValue: new Date(date),
//         modifiedAt: new Date()
//       });
//       payment.date = new Date(date);
//     }
    
//     if (notes) payment.notes = notes;

//     // Log activity
//     const Model = req.user.role === "Admin" ? Admin : Manager;
//     await Model.findByIdAndUpdate(req.user.id, {
//       $push: {
//         activityLogs: {
//           action: "UPDATE_PAYMENT",
//           details: `Updated payment ${payment.receiptNumber}`
//         }
//       }
//     });

//     const updatedPayment = await Repayment.findById(paymentId)
//       .populate("receivedBy", "name email")
//       .populate("loan", "amount status")
//       .populate("borrower", "name phone");

//     res.status(200).json({
//       message: "Payment updated successfully",
//       payment: updatedPayment
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating payment", error: error.message });
//   }
// };

// ============ DELETE PAYMENT ============

export const deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Repayment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update loan
    const loan = await Loan.findById(payment.loan);
    loan.payments = loan.payments.filter(r => r.toString() !== paymentId);
    loan.paymentSummary.totalPaid = (loan.paymentSummary.totalPaid || 0) - payment.amount;
    loan.paymentSummary.paymentCount = Math.max(0, (loan.paymentSummary.paymentCount || 1) - 1);
    
    loan.history.push({
      action: "PAYMENT_DELETED",
      performedBy: req.user.id,
      performedByRole: req.user.role,
      details: `Payment of ₹${payment.amount} (Receipt: ${payment.receiptNumber}) was deleted`,
      metadata: {
        deletedPayment: payment.toObject()
      },
      timestamp: new Date()
    });

    // Check if loan status should revert
    const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
    if (loan.status === "closed" && loan.paymentSummary.totalPaid < totalDue) {
      loan.status = "active";
    }

    await loan.save();

    // Log activity
    await Admin.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLogs: {
          action: "DELETE_PAYMENT",
          details: `Deleted payment ${payment.receiptNumber} of ₹${payment.amount}`
        }
      }
    });

    await Repayment.findByIdAndDelete(paymentId);

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting payment", error: error.message });
  }
};

export const getPaymentByReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params; // pass id of payment

    const payment = await Repayment.findOne({ receiptNumber })
      .populate("loan")
      .populate("borrower", "name phone")
      .populate("receivedBy", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check access
    if (req.user.role === "Manager") {
      const loan = await Loan.findById(payment.loan._id);
      if (loan.issuedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment", error: error.message });
  }
};

export const issueReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Repayment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check access
    if (req.user.role === "Manager" && payment.receivedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (payment.receiptIssued) {
      return res.status(400).json({ 
        message: "Receipt already issued",
        receiptNumber: payment.receiptNumber,
        issuedAt: payment.receiptIssuedAt
      });
    }

    payment.receiptIssued = true;
    payment.receiptIssuedAt = new Date();
    await payment.save();

    res.status(200).json({
      message: "Receipt issued successfully",
      receiptNumber: payment.receiptNumber,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: "Error issuing receipt", error: error.message });
  }
};