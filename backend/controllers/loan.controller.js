import Borrower from "../models/borrower.model.js";
import Loan from "../models/loan.model.js";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";
import Log from "../models/log.model.js";

// Ensures proper date parsing even if input is a string like "2025-10-26"
const parseDate = (dateInput) => {
  if (!dateInput) return null;

  // If already a Date, return as is
  if (dateInput instanceof Date) return dateInput;

  // Handle timestamp (number)
  if (!isNaN(dateInput)) return new Date(Number(dateInput));

  // Handle ISO or YYYY-MM-DD strings safely
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try manual split for "YYYY-MM-DD" (prevents UTC offset issue)
  const parts = dateInput.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }

  return null;
};


// ============ BORROWER MANAGEMENT ============

export const addBorrower = async (req, res) => {
  try {
    const {
      name,
      phone,
      aadharNumber,
      panNumber,
      chequeNumber,
      email,
      photo,
      alternatePhone,
      guardianName,
      guardianPhoto,
      relationship,
      permanentAddress,
      temporaryAddress
    } = req.body;

    const borrower = await Borrower.create({
      name,
      phone,
      aadharNumber,
      panNumber,
      chequeNumber,
      email,
      photo,
      alternatePhone,
      guardianName,
      guardianPhoto,
      relationship,
      permanentAddress,
      temporaryAddress,
      addedBy: req.user.id,
      addedByRole: req.user.role
    });

    // Update the user's borrowers array
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Model.findByIdAndUpdate(req.user.id, {
      $push: { borrowers: borrower._id }
    });

    // Log activity
    await Log.create({
      type: "Activity",
      action: "ADD_BORROWER",
      details: `Added borrower: ${name} (${phone}) - Account Number: ${borrower.accountNumber}`,
      ownerType: req.user.role,
      ownerId: req.user.id
    });

    res.status(201).json({ message: "Borrower added successfully", borrower });
  } catch (error) {
    res.status(500).json({ message: "Error adding borrower", error: error.message });
  }
};

export const getMyBorrowers = async (req, res) => {
  try {
    const borrowers = await Borrower.find({ addedBy: req.user.id })
      .populate("loans")
      .sort({ createdAt: -1 });

    res.status(200).json(borrowers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching borrowers", error: error.message });
  }
};

export const getAllBorrowers = async (req, res) => {
  try {
    const borrowers = await Borrower.find()
      .populate("loans")
      .sort({ createdAt: -1 });

    res.status(200).json(borrowers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching borrowers", error: error.message });
  }
};

export const getBorrowerById = async (req, res) => {
  try {
    const borrower = await Borrower.findById(req.params.id)
      .populate({
        path: "loans",
        populate: { path: "issuedBy", select: "name email" }
      })
      .populate("addedBy", "name email");

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    // Check if user has access to this borrower
    if (req.user.role === "Manager" && borrower.addedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(borrower);
  } catch (error) {
    res.status(500).json({ message: "Error fetching borrower", error: error.message });
  }
};

export const updateBorrower = async (req, res) => {
  try {
    const borrower = await Borrower.findById(req.params.id);

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    // Check if user has access to this borrower
    if (req.user.role === "Manager" && borrower.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      name,
      phone,
      aadharNumber,
      panNumber,
      chequeNumber,
      photo,
      alternatePhone,
      guardianName,
      guardianPhoto,
      relationship,
      permanentAddress,
      temporaryAddress
    } = req.body;

    const updatedBorrower = await Borrower.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        aadharNumber,
        panNumber,
        chequeNumber,
        photo,
        guardianPhoto,
        alternatePhone,
        guardianName,
        relationship,
        permanentAddress,
        temporaryAddress
      },
      { new: true, runValidators: true }
    );

    // Log activity
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Model.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLogs: {
          action: "UPDATE_BORROWER",
          details: `Updated borrower: ${name}`
        }
      }
    });

    res.status(200).json({ message: "Borrower updated successfully", borrower: updatedBorrower });
  } catch (error) {
    res.status(500).json({ message: "Error updating borrower", error: error.message });
  }
};

export const deleteBorrower = async (req, res) => {
  try {
    const borrower = await Borrower.findById(req.params.id);

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    // Check if user has access to this borrower
    if (req.user.role === "Manager" && borrower.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if borrower has active loans
    const activeLoans = await Loan.find({
      borrower: req.params.id,
      status: { $in: ["active", "overdue"] }
    });

    if (activeLoans.length > 0) {
      return res.status(400).json({
        message: "Cannot delete borrower with active/overdue loans",
        activeLoansCount: activeLoans.length
      });
    }

    await Borrower.findByIdAndDelete(req.params.id);

    // Remove from user's borrowers array
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Model.findByIdAndUpdate(req.user.id, {
      $pull: { borrowers: req.params.id }
    });

    // Log activity
    await Model.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLogs: {
          action: "DELETE_BORROWER",
          details: `Deleted borrower: ${borrower.name}`
        }
      }
    });

    res.status(200).json({ message: "Borrower deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting borrower", error: error.message });
  }
};

export const issueLoan = async (req, res) => {
  try {
    const { borrowerId, amount, interestRate, startDate, dueDate } = req.body;

    const borrower = await Borrower.findById(borrowerId);

    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    // Check if user has access to this borrower
    if (req.user.role === "Manager" && borrower.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only issue loans to your own borrowers" });
    }

    // Parse dates correctly
    const start = parseDate(startDate);
    const end = parseDate(dueDate);

    console.log("Parsed start date:", start);
    console.log("Parsed end date:", end);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (end <= start) {
      return res.status(400).json({ message: "Due date must be after start date" });
    }

    // Calculate loan details
    const interestAmount = (amount * interestRate) / 100;
    const totalDue = amount + interestAmount;

    // Calculate duration in 15-day periods
    const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const durationInPeriods = Math.max(1, Math.ceil(durationInDays / 15));
    const installmentAmount = totalDue / durationInPeriods;

    console.log("Loan calculation:", {
      amount,
      interestRate,
      interestAmount,
      totalDue,
      durationInDays,
      durationInPeriods,
      installmentAmount
    });

    // Generate repayment schedule (15-day intervals)
    const repaymentSchedule = [];
    let currentDate = new Date(start);
    let remainingAmount = totalDue;

    for (let i = 0; i < durationInPeriods; i++) {
      // Add 15 days to current date
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 15);

      // Don't exceed the due date
      if (currentDate > end) {
        currentDate = new Date(end);
      }

      // Calculate installment amount
      const isLastInstallment = (i === durationInPeriods - 1) || (currentDate >= end);
      const installment = isLastInstallment ? remainingAmount : installmentAmount;

      repaymentSchedule.push({
        dueDate: new Date(currentDate), 
        amount: Math.round(installment * 100) / 100, // Round to 2 decimals
        status: "pending"
      });

      remainingAmount -= installment;

      if (currentDate >= end) break;
    }

    // Create loan
    const loan = await Loan.create({
      borrower: borrowerId,
      issuedBy: req.user.id,
      issuedByRole: req.user.role,
      amount,
      interestRate,
      startDate: start,
      dueDate: end,
      status: "active",
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      repaymentSchedule
    });

    // Update borrower's loans array
    await Borrower.findByIdAndUpdate(borrowerId, {
      $push: { loans: loan._id }
    });

    // Update user's loanIssued array
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Model.findByIdAndUpdate(req.user.id, {
      $push: { loanIssued: loan._id }
    });

    // Log activity
    await Log.create({
      type: "Activity",
      action: "ISSUE_LOAN",
      details: `Issued loan of ₹${loan.amount} to ${borrower.name} (Loan ID: ${loan._id}). Installment amount: ₹${installmentAmount.toFixed(2)} every 15 days`,
      ownerType: req.user.role,
      ownerId: req.user.id
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(201).json({
      message: "Loan issued successfully",
      loan: populatedLoan
    });

  } catch (error) {
    console.error("Error issuing loan:", error);
    res.status(500).json({
      message: "Error issuing loan",
      error: error.message
    });
  }
};
export const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const { amount, interestRate, dueDate, status } = req.body;

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      { amount, interestRate, dueDate, status },
      { new: true, runValidators: true }
    ).populate("borrower", "name phone");

    // Log activity
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Log.create({
      type: "Activity",
      action: "UPDATE_LOAN",
      details: `Updated loan (Loan ID: ${req.params.id})`,
      ownerType: req.user.role,
      ownerId: req.user.id
    })

    res.status(200).json({ message: "Loan updated successfully", loan: updatedLoan });
  } catch (error) {
    res.status(500).json({ message: "Error updating loan", error: error.message });
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    await Loan.findByIdAndDelete(req.params.id);

    // Remove from user's borrowers array
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Model.findByIdAndUpdate(req.user.id, {
      $pull: { loans: req.params.id }
    });

    // Log activity
    await Log.create({
      type: "Activity",
      action: "DELETE_LOAN",
      details: `Deleted loan of ₹${loan.amount} (Loan ID: ${loan._id})`,
      ownerType: req.user.role,
      ownerId: req.user.id
    });

    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting loan", error: error.message });
  }
};

export const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate("borrower", "name phone photo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: loans.length,
      loans
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching loans", error: error.message });
  }
}

export const getMyLoans = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { issuedBy: req.user.id };
    if (status) query.status = status;

    const loans = await Loan.find(query)
      .populate("borrower", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: loans.length,
      loans
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching loans", error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate("borrower")
      .populate("issuedBy", "name email")
      .populate("payments.receivedBy", "name email");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy._id.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching loan", error: error.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const loanId = req.params.loanId || req.body.loanId;
    const { amount, date } = req.body;

    if (!loanId) {
      return res.status(400).json({ message: "Loan ID is required" });
    }

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Calculate total due INCLUDING late fees and waivers
    const interestAmount = loan.amount * loan.interestRate / 100;
    const lateFeeTotal = loan.lateFees?.reduce((sum, fee) => sum + (fee.isPaid ? 0 : fee.amount), 0) || 0;
    const waiverTotal = loan.waivers?.reduce((sum, waiver) => sum + waiver.amount, 0) || 0;
    const totalDue = loan.amount + interestAmount + lateFeeTotal - waiverTotal;

    const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= totalDue) {
      return res.status(400).json({ message: "Loan is already fully paid" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const newTotalPaid = totalPaid + amount;
    const currentBalance = totalDue - newTotalPaid;
    loan.amountPaid = newTotalPaid;

    // Add payment to loan
    loan.payments.push({
      date: new Date(date),
      amount,
      currentBalance,
      receivedBy: req.user.id,
      receivedByRole: req.user.role
    });

    // Allocate payment: First to late fees, then to installments
    let remainingAmount = amount;
    const paymentDate = new Date(date);

    // 1. Pay off unpaid late fees first
    for (let lateFee of loan.lateFees) {
      if (remainingAmount <= 0) break;
      
      if (!lateFee.isPaid) {
        const amountToPayToFee = Math.min(remainingAmount, lateFee.amount);
        
        if (amountToPayToFee >= lateFee.amount) {
          lateFee.isPaid = true;
          lateFee.paidDate = paymentDate;
        }
        
        remainingAmount -= amountToPayToFee;
      }
    }

    // 2. Then pay installments
    for (let schedule of loan.repaymentSchedule) {
      if (remainingAmount <= 0) break;

      if (schedule.status === "pending" || schedule.status === "overdue") {
        const amountToPay = Math.min(remainingAmount, schedule.amount - (schedule.paidAmount || 0));

        schedule.paidAmount = (schedule.paidAmount || 0) + amountToPay;

        if (schedule.paidAmount >= schedule.amount) {
          schedule.status = "paid";
          schedule.paidDate = paymentDate;
        }

        remainingAmount -= amountToPay;
      }
    }

    // Update loan status
    if (currentBalance <= 0) {
      loan.status = "closed";
    } else if (loan.status === "overdue" && new Date() <= loan.dueDate) {
      loan.status = "active";
    }

    await loan.save();

    // Log activity
    await Log.create({
      type: "Collection",
      action: "RECORD_PAYMENT",
      amount,
      loan: loanId,
      borrower: loan.borrower._id,
      receivedBy: req.user.id,
      receivedByRole: req.user.role,
      ownerType: req.user.role,
      ownerId: req.user.id,
      details: `Recorded payment of ₹${amount} for ${loan.borrower.name} (Loan ID: ${loanId}). Remaining balance: ₹${currentBalance.toFixed(2)}`
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({ message: "Payment recorded successfully", loan: updatedLoan });

  } catch (error) {
    res.status(500).json({ message: "Error recording payment", error: error.message });
  }
};


export const editRecordedPayment = async (req, res) => {
  try {
    const { loanId, paymentId } = req.params;
    const { newAmount, newDate, reason } = req.body;

    if (!newAmount || newAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    // Find the payment in loan.payments array
    const paymentIndex = loan.payments.findIndex(
      p => p._id.toString() === paymentId
    );

    if (paymentIndex === -1) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const oldPayment = loan.payments[paymentIndex];
    const oldAmount = oldPayment.amount;

    // Update the payment
    loan.payments[paymentIndex].amount = newAmount;
    loan.payments[paymentIndex].date = newDate ? new Date(newDate) : oldPayment.date;

    // Recalculate everything from scratch
    const sortedPayments = [...loan.payments].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate total due INCLUDING late fees and waivers
    const interestAmount = loan.amount * loan.interestRate / 100;
    const lateFeeTotal = loan.lateFees?.reduce((sum, fee) => sum + (fee.isPaid ? 0 : fee.amount), 0) || 0;
    const waiverTotal = loan.waivers?.reduce((sum, waiver) => sum + waiver.amount, 0) || 0;
    const totalDue = loan.amount + interestAmount + lateFeeTotal - waiverTotal;

    // Reset
    let totalPaid = 0;

    // Reset repayment schedule
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      loan.repaymentSchedule.forEach(schedule => {
        schedule.status = "pending";
        schedule.paidAmount = 0;
        schedule.paidDate = null;
      });
    }

    // Reset late fees
    if (loan.lateFees && loan.lateFees.length > 0) {
      loan.lateFees.forEach(fee => {
        fee.isPaid = false;
        fee.paidDate = null;
      });
    }

    // Reapply all payments in order
    for (let payment of sortedPayments) {
      totalPaid += payment.amount;
      payment.currentBalance = Math.max(0, totalDue - totalPaid);

      // Allocate this payment: First to late fees, then to installments
      let remainingAmount = payment.amount;
      const paymentDate = new Date(payment.date);

      // 1. Pay off unpaid late fees first
      for (let lateFee of loan.lateFees) {
        if (remainingAmount <= 0) break;
        
        if (!lateFee.isPaid) {
          const amountToPayToFee = Math.min(remainingAmount, lateFee.amount);
          
          if (amountToPayToFee >= lateFee.amount) {
            lateFee.isPaid = true;
            lateFee.paidDate = paymentDate;
          }
          
          remainingAmount -= amountToPayToFee;
        }
      }

      // 2. Then pay installments
      if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
        for (let schedule of loan.repaymentSchedule) {
          if (remainingAmount <= 0) break;

          if (schedule.status === "pending" || schedule.status === "overdue") {
            const amountToPay = Math.min(remainingAmount, schedule.amount - (schedule.paidAmount || 0));

            schedule.paidAmount = (schedule.paidAmount || 0) + amountToPay;

            if (schedule.paidAmount >= schedule.amount) {
              schedule.status = "paid";
              schedule.paidDate = paymentDate;
            }

            remainingAmount -= amountToPay;
          }
        }
      }
    }

    // Update loan totals
    loan.amountPaid = totalPaid;
    const currentBalance = totalDue - totalPaid;

    // Update loan status
    if (currentBalance <= 0) {
      loan.status = "closed";
    } else if (loan.status === "closed") {
      loan.status = new Date() > new Date(loan.dueDate) ? "overdue" : "active";
    } else if (loan.status === "overdue" && new Date() <= loan.dueDate) {
      loan.status = "active";
    }

    await loan.save();

    // Update the collection log
    const collectionLog = await Log.findOne({
      type: "Collection",
      loan: loanId,
      amount: oldAmount,
      timestamp: {
        $gte: new Date(oldPayment.date).setHours(0, 0, 0, 0),
        $lte: new Date(oldPayment.date).setHours(23, 59, 59, 999)
      }
    });

    if (collectionLog) {
      collectionLog.amount = newAmount;
      if (newDate) {
        collectionLog.timestamp = new Date(newDate);
      }

      if (!collectionLog.metadata) {
        collectionLog.metadata = {};
      }
      collectionLog.metadata.edited = true;
      collectionLog.metadata.editedBy = req.user.id;
      collectionLog.metadata.editedAt = new Date();
      collectionLog.metadata.originalAmount = oldAmount;
      collectionLog.metadata.editReason = reason || "Amount correction";

      await collectionLog.save();
    }

    // Log the edit action
    await Log.create({
      type: "Activity",
      action: "EDIT_PAYMENT",
      details: `Edited payment for ${loan.borrower.name}: Changed from ₹${oldAmount} to ₹${newAmount} (Loan ID: ${loanId}). New balance: ₹${currentBalance.toFixed(2)}`,
      ownerType: req.user.role,
      ownerId: req.user.id
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({
      message: "Payment edited successfully",
      loan: updatedLoan,
      changes: {
        oldAmount,
        newAmount,
        difference: newAmount - oldAmount,
        newBalance: currentBalance
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Error editing payment",
      error: error.message
    });
  }
};


export const deleteRecordedPayment = async (req, res) => {
  try {
    const { loanId, paymentId } = req.params;
    const { reason } = req.body;

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    // Find payment
    const paymentIndex = loan.payments.findIndex(
      p => p._id.toString() === paymentId
    );

    if (paymentIndex === -1) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const deletedPayment = loan.payments[paymentIndex];

    // Remove payment
    loan.payments.splice(paymentIndex, 1);

    // Recalculate everything
    const sortedPayments = [...loan.payments].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let totalPaid = 0;
    const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);

    // Reset repayment schedule
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      loan.repaymentSchedule.forEach(schedule => {
        schedule.status = "pending";
        schedule.paidAmount = 0;
        schedule.paidDate = null;
      });
    }

    // Reapply remaining payments
    for (let payment of sortedPayments) {
      totalPaid += payment.amount;
      payment.currentBalance = Math.max(0, totalDue - totalPaid);

      if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
        let remainingAmount = payment.amount;
        const paymentDate = new Date(payment.date);

        for (let schedule of loan.repaymentSchedule) {
          if (remainingAmount <= 0) break;

          if (schedule.status === "pending" || schedule.status === "overdue") {
            const amountToPay = Math.min(remainingAmount, schedule.amount - (schedule.paidAmount || 0));

            schedule.paidAmount = (schedule.paidAmount || 0) + amountToPay;

            if (schedule.paidAmount >= schedule.amount) {
              schedule.status = "paid";
              schedule.paidDate = paymentDate;
            }

            remainingAmount -= amountToPay;
          }
        }
      }
    }

    loan.amountPaid = totalPaid;
    const currentBalance = totalDue - totalPaid;

    // Update loan status
    if (currentBalance <= 0) {
      loan.status = "closed";
    } else if (loan.status === "closed") {
      loan.status = new Date() > new Date(loan.dueDate) ? "overdue" : "active";
    }

    await loan.save();

    // Mark collection log as deleted
    const collectionLog = await Log.findOne({
      type: "Collection",
      loan: loanId,
      amount: deletedPayment.amount,
      timestamp: {
        $gte: new Date(deletedPayment.date).setHours(0, 0, 0, 0),
        $lte: new Date(deletedPayment.date).setHours(23, 59, 59, 999)
      }
    });

    if (collectionLog) {
      if (!collectionLog.metadata) {
        collectionLog.metadata = {};
      }
      collectionLog.metadata.deleted = true;
      collectionLog.metadata.deletedBy = req.user.id;
      collectionLog.metadata.deletedAt = new Date();
      collectionLog.metadata.deleteReason = reason || "Payment reversal";

      await collectionLog.save();
    }

    // Log deletion
    await Log.create({
      type: "Activity",
      action: "DELETE_PAYMENT",
      details: `Deleted payment of ₹${deletedPayment.amount} from ${loan.borrower.name} (Loan ID: ${loanId})`,
      ownerType: req.user.role,
      ownerId: req.user.id
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({
      message: "Payment deleted successfully",
      loan: updatedLoan
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting payment",
      error: error.message
    });
  }
};

export const getPaymentRecords = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email")
      .populate("payments.receivedBy", "name email");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy._id.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    res.status(200).json(loan.payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment records", error: error.message });
  }

}

export const getLast24hrPayments = async (req, res) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const query = {
      type: "Collection",
      action: "RECORD_PAYMENT",
      createdAt: { $gte: yesterday, $lte: now }
    };

    // if (req.user.role === "Manager") {
    //   query.receivedBy = req.user.id;
    // }

    const payments = await Log.find(query)
      .populate("loan", "amount status")
      .populate("borrower", "name phone")
      .populate("receivedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
};

export const whoHasToPayToday = async (req, res) => {
  try {
    const today = new Date();
    const todayDay = today.getDate();

    // Normalize to start/end of day (UTC safe)
    const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

    // Build query
    const query = {
      status: { $in: ["active", "overdue"] },
      $or: [
        // New loans using repayment schedule
        {
          repaymentSchedule: {
            $elemMatch: {
              dueDate: { $gte: startOfDay, $lte: endOfDay },
              status: { $in: ["pending", "overdue"] },
            },
          },
        },
        // Old loans using repaymentDay
        {
          repaymentDay: todayDay,
          $or: [
            { repaymentSchedule: { $exists: false } },
            { repaymentSchedule: { $size: 0 } }
          ]
        },
      ],
    };

    const loans = await Loan.find(query)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email issuedByRole")
      .lean(); // lean() for faster mapping

    // Format due payments
    const duePayments = loans.map((loan) => {
      const payments = loan.payments || [];
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalDue = loan.amount + (loan.amount * loan.interestRate) / 100;
      const currentBalance = Math.max(0, totalDue - totalPaid);

      // Find today's installment (UTC-normalized)
      let todayInstallment = null;
      if (loan.repaymentSchedule?.length) {
        todayInstallment = loan.repaymentSchedule.find((schedule) => {
          const d = new Date(schedule.dueDate);
          return d >= startOfDay && d <= endOfDay;
        });
      }

      return {
        _id: loan._id,
        borrower: loan.borrower,
        loanAmount: loan.amount,
        interestRate: loan.interestRate,
        totalPaid,
        totalDue,
        currentBalance,
        dueToday: todayInstallment?.amount || loan.monthlyInstallment || (currentBalance / 12),
        installmentStatus: todayInstallment?.status || "pending",
        dueDate: todayInstallment?.dueDate || today,
        status: loan.status,
        issuedBy: loan.issuedBy,
        issuedByRole: loan.issuedByRole || req.user.role,
      };
    });

    // Sort by borrower name safely
    duePayments.sort((a, b) => a.borrower?.name?.localeCompare(b.borrower?.name || ""));

    res.status(200).json(duePayments);
  } catch (error) {
    console.error("Error fetching due payments:", error);
  }
};


// ============ PORTFOLIO & REPORTS ============

export const getMyPortfolioStats = async (req, res) => {
  try {
    const loans = await Loan.find({ issuedBy: req.user.id })
      .populate("borrower", "name phone");

    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === "active").length;
    const overdueLoans = loans.filter(l => l.status === "overdue").length;
    const closedLoans = loans.filter(l => l.status === "closed").length;

    const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalRepaid = loans.reduce((sum, loan) => {
      return sum + loan.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
    }, 0);

    const totalInterestExpected = loans.reduce((sum, loan) => {
      return sum + ((loan.amount * loan.interestRate / 100) || 0);
    }, 0);

    res.status(200).json({
      totalLoans,
      activeLoans,
      overdueLoans,
      closedLoans,
      totalLoaned,
      totalRepaid,
      outstanding: totalLoaned - totalRepaid,
      totalInterestExpected
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio stats", error: error.message });
  }
};

export const getMyOverdueLoans = async (req, res) => {
  try {
    const overdueLoans = await Loan.find({
      issuedBy: req.user.role === "admin" ? { $exists: true } : req.user.id,
      status: "overdue"
    })
      .populate("borrower", "name phone")
      .sort({ dueDate: 1 });

    res.status(200).json(overdueLoans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching overdue loans", error: error.message });
  }
};

// Add these new functions to your loan.controller.js

// ============ LATE FEE MANAGEMENT ============

/**
 * Apply ₹500 late fee for missed repayment schedule
 * Can be called manually or automatically via cron job
 */
export const applyMissedPaymentLateFee = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status === "closed" || loan.status === "written-off") {
      return res.status(400).json({ message: "Cannot apply late fee to closed/written-off loan" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    // Find overdue installments
    const today = new Date();
    const overdueSchedules = loan.repaymentSchedule.filter(
      schedule => schedule.status === "pending" && new Date(schedule.dueDate) < today
    );

    if (overdueSchedules.length === 0) {
      return res.status(400).json({ message: "No overdue installments found" });
    }

    // Calculate days overdue for the earliest missed payment
    const earliestOverdue = overdueSchedules.reduce((earliest, current) => 
      new Date(current.dueDate) < new Date(earliest.dueDate) ? current : earliest
    );
    const daysOverdue = Math.ceil((today - new Date(earliestOverdue.dueDate)) / (1000 * 60 * 60 * 24));

    // Add ₹500 late fee
    const lateFeeAmount = 500;
    
    loan.lateFees.push({
      amount: lateFeeAmount,
      appliedDate: today,
      appliedBy: req.user.id,
      appliedByRole: req.user.role,
      reason: reason || `Missed payment - ${daysOverdue} days overdue`,
      daysOverdue,
      isPaid: false
    });

    // Mark overdue schedules
    overdueSchedules.forEach(schedule => {
      schedule.status = "overdue";
    });

    await loan.save();

    // Log activity
    await Log.create({
      type: "Activity",
      action: "APPLY_LATE_FEE",
      details: `Applied ₹${lateFeeAmount} late fee to ${loan.borrower.name} (Loan ID: ${loanId}) - ${daysOverdue} days overdue`,
      ownerType: req.user.role,
      ownerId: req.user.id,
      loan: loanId,
      borrower: loan.borrower._id
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({
      message: "Late fee applied successfully",
      lateFeeAmount,
      daysOverdue,
      loan: updatedLoan
    });

  } catch (error) {
    console.error("Error applying late fee:", error);
    res.status(500).json({
      message: "Error applying late fee",
      error: error.message
    });
  }
};

/**
 * Apply 15% overdue penalty on outstanding amount
 * This is for loans that have crossed their final due date
 */
export const applyOverduePenalty = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status === "closed" || loan.status === "written-off") {
      return res.status(400).json({ message: "Cannot apply penalty to closed/written-off loan" });
    }

    // Check if user has access to this loan
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    // Check if loan is actually overdue
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    
    if (today <= dueDate) {
      return res.status(400).json({ message: "Loan is not yet overdue" });
    }

    // Calculate  amount
    const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
    const totalPaid = loan.amountPaid || 0;
    const outstandingAmount = totalDue - totalPaid;

    if (outstandingAmount <= 0) {
      return res.status(400).json({ message: "No outstanding amount" });
    }

    // Calculate 15% penalty
    const penaltyAmount = Math.round((outstandingAmount * 15 / 100) * 100) / 100;
    const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

    // Add penalty as late fee
    loan.lateFees.push({
      amount: penaltyAmount,
      appliedDate: today,
      appliedBy: req.user.id,
      appliedByRole: req.user.role,
      reason: reason || `15% overdue penalty - ${daysOverdue} days past due date`,
      daysOverdue,
      isPaid: false
    });

    // Update loan status
    if (loan.status !== "overdue") {
      loan.status = "overdue";
    }

    await loan.save();

    // Log activity
    await Log.create({
      type: "Activity",
      action: "APPLY_OVERDUE_PENALTY",
      details: `Applied 15% overdue penalty of ₹${penaltyAmount} to ${loan.borrower.name} (Loan ID: ${loanId}) - Outstanding: ₹${outstandingAmount}`,
      ownerType: req.user.role,
      ownerId: req.user.id,
      loan: loanId,
      borrower: loan.borrower._id
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({
      message: "Overdue penalty applied successfully",
      penaltyAmount,
      outstandingAmount,
      daysOverdue,
      loan: updatedLoan
    });

  } catch (error) {
    console.error("Error applying overdue penalty:", error);
    res.status(500).json({
      message: "Error applying overdue penalty",
      error: error.message
    });
  }
};

export const applyCustomLateFee = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amount, reason } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Please provide a valid amount" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Please provide a reason for the late fee" });
    }

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status === "closed" || loan.status === "written-off") {
      return res.status(400).json({ 
        message: "Cannot apply late fee to closed/written-off loan" 
      });
    }

    // Check if user has access to this loan (uncomment if needed)
    // if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const today = new Date();

    // Calculate days overdue if applicable
    let daysOverdue = 0;
    const dueDate = new Date(loan.dueDate);
    if (today > dueDate) {
      daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
    }

    // Check for overdue installments
    const overdueSchedules = loan.repaymentSchedule?.filter(
      schedule => schedule.status === "pending" && new Date(schedule.dueDate) < today
    ) || [];

    if (overdueSchedules.length > 0) {
      const earliestOverdue = overdueSchedules.reduce((earliest, current) => 
        new Date(current.dueDate) < new Date(earliest.dueDate) ? current : earliest
      );
      const scheduleDaysOverdue = Math.ceil(
        (today - new Date(earliestOverdue.dueDate)) / (1000 * 60 * 60 * 24)
      );
      daysOverdue = Math.max(daysOverdue, scheduleDaysOverdue);

      // Mark overdue schedules
      overdueSchedules.forEach(schedule => {
        schedule.status = "overdue";
      });
    }

    // Add the custom late fee
    loan.lateFees.push({
      amount: parseFloat(amount),
      appliedDate: today,
      appliedBy: req.user.id,
      appliedByRole: req.user.role,
      reason: reason.trim(),
      daysOverdue,
      isPaid: false
    });

    // Update loan status if overdue
    if (daysOverdue > 0 && loan.status === "active") {
      loan.status = "overdue";
    }

    await loan.save();

    // Log activity
    await Log.create({
      type: "Activity",
      action: "APPLY_LATE_FEE",
      details: `Applied ₹${amount} late fee to ${loan.borrower.name} (Loan ID: ${loanId}) - Reason: ${reason}${daysOverdue > 0 ? ` (${daysOverdue} days overdue)` : ''}`,
      ownerType: req.user.role,
      ownerId: req.user.id,
      loan: loanId,
      borrower: loan.borrower._id
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({
      message: "Late fee applied successfully",
      lateFeeAmount: parseFloat(amount),
      daysOverdue,
      loan: updatedLoan
    });

  } catch (error) {
    console.error("Error applying late fee:", error);
    res.status(500).json({
      message: "Error applying late fee",
      error: error.message
    });
  }
};
export const autoApplyLateFees = async (req, res) => {
  try {
    const today = new Date();
    const results = {
      missedPaymentFees: [],
      overduePenalties: [],
      errors: []
    };

    // Find all active/overdue loans
    const loans = await Loan.find({
      status: { $in: ["active", "overdue"] }
    }).populate("borrower", "name phone");

    for (const loan of loans) {
      try {
        // Check for missed repayment schedule payments (₹500 fee)
        const overdueSchedules = loan.repaymentSchedule.filter(
          schedule => schedule.status === "pending" && new Date(schedule.dueDate) < today
        );

        if (overdueSchedules.length > 0) {
          // Check if late fee was already applied today
          const feesAppliedToday = loan.lateFees.filter(fee => {
            const feeDate = new Date(fee.appliedDate);
            return feeDate.toDateString() === today.toDateString();
          });

          // Only apply if no fee applied today for missed payments
          const hasMissedPaymentFeeToday = feesAppliedToday.some(
            fee => fee.reason && fee.reason.includes("Missed payment")
          );

          if (!hasMissedPaymentFeeToday) {
            const earliestOverdue = overdueSchedules.reduce((earliest, current) => 
              new Date(current.dueDate) < new Date(earliest.dueDate) ? current : earliest
            );
            const daysOverdue = Math.ceil((today - new Date(earliestOverdue.dueDate)) / (1000 * 60 * 60 * 24));

            loan.lateFees.push({
              amount: 500,
              appliedDate: today,
              appliedBy: null,
              appliedByRole: "System",
              reason: `Auto-applied: Missed payment - ${daysOverdue} days overdue`,
              daysOverdue,
              isPaid: false
            });

            overdueSchedules.forEach(schedule => {
              schedule.status = "overdue";
            });

            results.missedPaymentFees.push({
              loanId: loan._id,
              borrower: loan.borrower.name,
              amount: 500,
              daysOverdue
            });
          }
        }

        // Check if loan due date has passed (15% penalty)
        const dueDate = new Date(loan.dueDate);
        if (today > dueDate) {
          const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
          const totalPaid = loan.amountPaid || 0;
          const outstandingAmount = totalDue - totalPaid;

          if (outstandingAmount > 0) {
            // Check if 15% penalty was already applied
            const hasOverduePenalty = loan.lateFees.some(
              fee => fee.reason && fee.reason.includes("15% overdue penalty")
            );

            if (!hasOverduePenalty) {
              const penaltyAmount = Math.round((outstandingAmount * 15 / 100) * 100) / 100;
              const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

              loan.lateFees.push({
                amount: penaltyAmount,
                appliedDate: today,
                appliedBy: null,
                appliedByRole: "System",
                reason: `Auto-applied: 15% overdue penalty - ${daysOverdue} days past due date`,
                daysOverdue,
                isPaid: false
              });

              loan.status = "overdue";

              results.overduePenalties.push({
                loanId: loan._id,
                borrower: loan.borrower.name,
                amount: penaltyAmount,
                outstandingAmount,
                daysOverdue
              });
            }
          }
        }

        await loan.save();

        // Log if any fees were applied
        if (results.missedPaymentFees.some(f => f.loanId.equals(loan._id)) || 
            results.overduePenalties.some(p => p.loanId.equals(loan._id))) {
          await Log.create({
            type: "Activity",
            action: "AUTO_APPLY_LATE_FEES",
            details: `System auto-applied late fees for ${loan.borrower.name} (Loan ID: ${loan._id})`,
            ownerType: "System",
            ownerId: null,
            loan: loan._id,
            borrower: loan.borrower._id
          });
        }

      } catch (error) {
        results.errors.push({
          loanId: loan._id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: "Auto late fee application completed",
      summary: {
        totalMissedPaymentFees: results.missedPaymentFees.length,
        totalOverduePenalties: results.overduePenalties.length,
        totalErrors: results.errors.length
      },
      results
    });

  } catch (error) {
    console.error("Error in auto late fee application:", error);
    res.status(500).json({
      message: "Error in auto late fee application",
      error: error.message
    });
  }
};

/**
 * Auto-check and apply late fees for all loans
 * This should be called by a cron job daily
 */

export const waiveLateFee = async (req, res) => {
  try {
    const { loanId, lateFeeId } = req.params;
    const { reason } = req.body;

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access
    if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const lateFee = loan.lateFees.id(lateFeeId);

    if (!lateFee) {
      return res.status(404).json({ message: "Late fee not found" });
    }

    if (lateFee.isPaid) {
      return res.status(400).json({ message: "Cannot waive already paid late fee" });
    }

    // Add waiver
    loan.waivers.push({
      amount: lateFee.amount,
      type: "late_fee_waiver",
      grantedDate: new Date(),
      grantedBy: req.user.id,
      grantedByRole: req.user.role,
      reason: reason || "Late fee waived"
    });

    // Mark late fee as paid (waived)
    lateFee.isPaid = true;

    await loan.save();

    // Log activity
    await Log.create({
      type: "Activity",
      action: "WAIVE_LATE_FEE",
      details: `Waived late fee of ₹${lateFee.amount} for ${loan.borrower.name} (Loan ID: ${loanId})`,
      ownerType: req.user.role,
      ownerId: req.user.id,
      loan: loanId,
      borrower: loan.borrower._id
    });

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({
      message: "Late fee waived successfully",
      loan: updatedLoan
    });

  } catch (error) {
    console.error("Error waiving late fee:", error);
    res.status(500).json({
      message: "Error waiving late fee",
      error: error.message
    });
  }
};