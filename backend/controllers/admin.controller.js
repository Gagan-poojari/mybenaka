import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import Manager from "../models/manager.model.js";
import Borrower from "../models/borrower.model.js";
import Loan from "../models/loan.model.js";
import Repayment from "../models/repayment.model.js";

// ============ PROFILE MANAGEMENT ============

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id)
      .select("-password")
      .populate("managers", "name email")
      .populate("borrowers", "name phone");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, contacts } = req.body;
    
    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { name, contacts },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    res.status(200).json({ message: "Profile updated successfully", admin });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();
    
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

// ============ MANAGER MANAGEMENT ============

export const createManager = async (req, res) => {
  try {
    const { name, email, password, contacts, address } = req.body;
    
    if (!name || !email || !password || !address) {
      return res.status(400).json({ message: "Name, email, password, and address are required" });
    }
    
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ message: "Manager with this email already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const manager = await Manager.create({
      name,
      email,
      password: hashedPassword,
      contacts: contacts || [],
      address
    });
    
    await Admin.findByIdAndUpdate(req.user.id, {
      $push: { managers: manager._id }
    });
    
    // Log activity
    await Admin.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLogs: {
          action: "CREATE_MANAGER",
          details: `Created manager: ${name} (${email})`
        }
      }
    });
    
    const managerResponse = manager.toObject();
    delete managerResponse.password;
    
    res.status(201).json({ message: "Manager created successfully", manager: managerResponse });
  } catch (error) {
    res.status(500).json({ message: "Error creating manager", error: error.message });
  }
};

export const getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find()
      .select("-password")
      .populate("borrowers", "name phone")
      .populate("loanIssued")
      .sort({ createdAt: -1 });
    
    res.status(200).json(managers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching managers", error: error.message });
  }
};

export const getManagerById = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id)
      .select("-password")
      .populate("borrowers")
      .populate({
        path: "loanIssued",
        populate: { path: "borrower", select: "name phone" }
      });
    
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    
    res.status(200).json(manager);
  } catch (error) {
    res.status(500).json({ message: "Error fetching manager", error: error.message });
  }
};

export const updateManager = async (req, res) => {
  try {
    const { name, email, contacts, address } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (contacts) updateData.contacts = contacts;
    if (address) updateData.address = address;
    
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    
    // Log activity
    await Admin.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLogs: {
          action: "UPDATE_MANAGER",
          details: `Updated manager: ${manager.name}`
        }
      }
    });
    
    res.status(200).json({ message: "Manager updated successfully", manager });
  } catch (error) {
    res.status(500).json({ message: "Error updating manager", error: error.message });
  }
};

export const deleteManager = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    
    // Check if manager has active loans
    const activeLoans = await Loan.find({ 
      issuedBy: manager._id, 
      status: { $in: ["active", "overdue"] }
    });
    
    if (activeLoans.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete manager with active or overdue loans. Please close or transfer all loans first.",
        activeLoansCount: activeLoans.length
      });
    }
    
    await Manager.findByIdAndDelete(req.params.id);
    
    await Admin.findByIdAndUpdate(req.user.id, {
      $pull: { managers: req.params.id }
    });
    
    // Log activity
    await Admin.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLogs: {
          action: "DELETE_MANAGER",
          details: `Deleted manager: ${manager.name}`
        }
      }
    });
    
    res.status(200).json({ message: "Manager deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting manager", error: error.message });
  }
};

export const getManagerPortfolio = async (req, res) => {
  try {
    const loans = await Loan.find({ issuedBy: req.params.id })
      .populate("borrower", "name phone");
    
    const repayments = await Repayment.find({ 
      loan: { $in: loans.map(l => l._id) }
    });
    
    const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalRepaid = repayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const activeLoans = loans.filter(l => l.status === "active").length;
    const overdueLoans = loans.filter(l => l.status === "overdue").length;
    const closedLoans = loans.filter(l => l.status === "closed").length;
    
    res.status(200).json({
      totalLoans: loans.length,
      activeLoans,
      overdueLoans,
      closedLoans,
      totalLoaned,
      totalRepaid,
      outstanding: totalLoaned - totalRepaid,
      loans
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio", error: error.message });
  }
};

// ============ SYSTEM-WIDE DASHBOARD ============

export const getDashboardStats = async (req, res) => {
  try {
    const totalManagers = await Manager.countDocuments();
    const totalBorrowers = await Borrower.countDocuments();
    const totalLoans = await Loan.countDocuments();
    
    const loans = await Loan.find();
    
    const activeLoans = loans.filter(l => l.status === "active").length;
    const overdueLoans = loans.filter(l => l.status === "overdue").length;
    const closedLoans = loans.filter(l => l.status === "closed").length;
    
    const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    
    // Get all repayments
    const allRepayments = await Repayment.find();
    const totalRepaid = allRepayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const totalInterestExpected = loans.reduce((sum, loan) => {
      return sum + ((loan.amount * loan.interestRate / 100) || 0);
    }, 0);
    
    res.status(200).json({
      totalManagers,
      totalBorrowers,
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
    res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
  }
};

export const getAllSystemLoans = async (req, res) => {
  try {
    const { status, issuedBy, borrowerId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (issuedBy) query.issuedBy = issuedBy;
    if (borrowerId) query.borrower = borrowerId;
    
    const loans = await Loan.find(query)
      .populate("borrower", "name phone")
      .populate("issuedBy", "name email")
      .populate("repayments")
      .sort({ createdAt: -1 });
    
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching loans", error: error.message });
  }
};

export const getAllSystemBorrowers = async (req, res) => {
  try {
    const borrowers = await Borrower.find()
      .populate("addedBy", "name email")
      .populate("loans")
      .sort({ createdAt: -1 });
    
    res.status(200).json(borrowers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching borrowers", error: error.message });
  }
};

// ============ REPORTS ============

export const getOverdueLoans = async (req, res) => {
  try {
    const overdueLoans = await Loan.find({ status: "overdue" })
      .populate("borrower", "name phone permanentAddress")
      .populate("issuedBy", "name email")
      .populate("repayments")
      .sort({ dueDate: 1 });
    
    res.status(200).json(overdueLoans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching overdue loans", error: error.message });
  }
};

export const getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await Repayment.find(dateFilter)
      .populate("borrower", "name phone")
      .populate("loan", "amount status")
      .populate("receivedBy", "name email")
      .sort({ date: -1 });
    
    let totalCollected = 0;
    let collectionsByUser = {};
    let collectionsByMethod = {};
    
    payments.forEach(payment => {
      totalCollected += payment.amount;
      
      // By user
      const userId = payment.receivedBy?._id?.toString();
      const userName = payment.receivedBy?.name || "Unknown";
      if (userId) {
        if (!collectionsByUser[userId]) {
          collectionsByUser[userId] = {
            name: userName,
            amount: 0,
            count: 0
          };
        }
        collectionsByUser[userId].amount += payment.amount;
        collectionsByUser[userId].count += 1;
      }
      
      // By payment method
      const method = payment.paymentMethod || "cash";
      if (!collectionsByMethod[method]) {
        collectionsByMethod[method] = {
          amount: 0,
          count: 0
        };
      }
      collectionsByMethod[method].amount += payment.amount;
      collectionsByMethod[method].count += 1;
    });
    
    res.status(200).json({
      totalCollected,
      totalPayments: payments.length,
      collectionsByUser,
      collectionsByMethod,
      payments
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating collection report", error: error.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const loans = await Loan.find({ status: { $in: ["active", "closed", "overdue"] } });
    const allRepayments = await Repayment.find();
    
    let totalPrincipal = 0;
    let totalInterestExpected = 0;
    let totalRepaid = 0;
    let totalLateFees = 0;
    let totalWaivers = 0;
    
    loans.forEach(loan => {
      totalPrincipal += loan.amount || 0;
      totalInterestExpected += (loan.amount * loan.interestRate / 100) || 0;
      
      // Calculate late fees
      if (loan.lateFees && Array.isArray(loan.lateFees)) {
        totalLateFees += loan.lateFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
      }
      
      // Calculate waivers
      if (loan.waivers && Array.isArray(loan.waivers)) {
        totalWaivers += loan.waivers.reduce((sum, waiver) => sum + (waiver.amount || 0), 0);
      }
    });
    
    totalRepaid = allRepayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.status(200).json({
      totalPrincipal,
      totalInterestExpected,
      totalLateFees,
      totalWaivers,
      totalExpectedRevenue: totalPrincipal + totalInterestExpected + totalLateFees - totalWaivers,
      totalRepaid,
      outstanding: totalPrincipal - totalRepaid,
      profitRealized: totalRepaid - totalPrincipal,
      totalLoans: loans.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating revenue report", error: error.message });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const admin = await Admin.findById(req.user.id).select("activityLogs");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const logs = admin.activityLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit));
    
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};