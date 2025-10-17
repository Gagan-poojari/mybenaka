import Borrower from "../models/borrower.model.js";
import Loan from "../models/loan.model.js";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";
import Log from "../models/log.model.js";

const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("-");
  return new Date(Date.UTC(year, month - 1, day)); // month is 0-based
};


// ============ BORROWER MANAGEMENT ============

export const addBorrower = async (req, res) => {
  try {
    const {
      name,
      phone,
      alternatePhone,
      guardianName,
      relationship,
      permanentAddress,
      temporaryAddress
    } = req.body;

    const borrower = await Borrower.create({
      name,
      phone,
      alternatePhone,
      guardianName,
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
      details: `Added borrower: ${name} (${phone})`,
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
      alternatePhone,
      guardianName,
      relationship,
      permanentAddress,
      temporaryAddress
    } = req.body;

    const updatedBorrower = await Borrower.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
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



// ============ LOAN OPERATIONS ============

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

    const loan = await Log.create({
      borrower: borrowerId,
      issuedBy: req.user.id,
      issuedByRole: req.user.role,
      amount,
      interestRate,
      startDate: parseDate(startDate),
      dueDate: parseDate(dueDate),
      status: "active"
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
      details: `Issued loan of ₹${loan.amount} to ${borrower.name} (Loan ID: ${loan._id})`,
      ownerType: req.user.role,
      ownerId: req.user.id
    })

    const populatedLoan = await Loan.findById(loan._id)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(201).json({ message: "Loan issued successfully", loan: populatedLoan });

  } catch (error) {
    res.status(500).json({ message: "Error issuing loan", error: error.message });
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
    if (req.user.role === "Manager" && loan.issuedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching loan", error: error.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { loanId, amount, date } = req.body;

    const loan = await Loan.findById(loanId).populate("borrower", "name phone");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.currentBalance <= 0) {
      return res.status(400).json({ message: "Loan is already fully paid" });
    }

    // Check if user has access to this loan
    if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Calculate total paid
    const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
    const currentBalance = totalDue - totalPaid;
    loan.amountPaid = totalPaid;

    // Add payment to loan

    loan.payments.push({
      date: new Date(date),
      amount,
      currentBalance,
      receivedBy: req.user.id,
      receivedByRole: req.user.role
    });

    // Update loan status
    if (currentBalance <= 0) {
      loan.status = "closed";
    } else if (loan.status === "overdue" && new Date() <= loan.dueDate) {
      loan.status = "active";
    }

    await loan.save();

    // Log activity
    const Model = req.user.role === "Admin" ? Admin : Manager;
    await Log.create({
      type: "Activity",
      action: "RECORD_PAYMENT",
      details: `Recorded payment of ₹${amount} (Loan ID: ${loanId})`,
      ownerType: req.user.role,
      ownerId: req.user.id
    })

    const updatedLoan = await Loan.findById(loanId)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email");

    res.status(200).json({ message: "Payment recorded successfully", loan: updatedLoan });

  } catch (error) {
    res.status(500).json({ message: "Error recording payment", error: error.message });
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
    if (req.user.role === "Manager" && loan.issuedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(loan.payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment records", error: error.message });
  }
  
}

export const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if user has access to this loan
    if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

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
      issuedBy: req.user.id,
      status: "overdue"
    })
      .populate("borrower", "name phone")
      .sort({ dueDate: 1 });

    res.status(200).json(overdueLoans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching overdue loans", error: error.message });
  }
};