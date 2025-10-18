import Log from "../models/log.model.js";
import Loan from "../models/loan.model.js";
import Borrower from "../models/borrower.model.js";

// ============ GET MY ACTIVITY LOGS ============

export const getMyActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;

    let query = {
      type: "Activity",
      ownerType: req.user.role,
      ownerId: req.user.id
    };

    if (action) {
      query.action = action;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Log.countDocuments(query);

    res.status(200).json({
      logs,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};

// ============ GET MY COLLECTION LOGS ============

export const getMyCollectionLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    let query = {
      type: "Collection",
      receivedBy: req.user.id
    };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await Log.find(query)
      .populate("loan", "amount status")
      .populate("borrower", "name phone")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCollected = await Log.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalCount = await Log.countDocuments(query);

    res.status(200).json({
      logs,
      totalCollected: totalCollected[0]?.total || 0,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching collection logs", error: error.message });
  }
};

// ============ GET ALL ACTIVITY LOGS (Admin only) ============

export const getAllActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, ownerType, ownerId, action } = req.query;

    let query = { type: "Activity" };

    if (ownerType) query.ownerType = ownerType;
    if (ownerId) query.ownerId = ownerId;
    if (action) query.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await Log.find(query)
      .populate("ownerId", "name email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Log.countDocuments(query);

    res.status(200).json({
      logs,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};

// ============ GET ALL COLLECTION LOGS (Admin only) ============

export const getAllCollectionLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, receivedBy, startDate, endDate } = req.query;

    let query = { type: "Collection" };

    if (receivedBy) query.receivedBy = receivedBy;
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await Log.find(query)
      .populate("loan", "amount status")
      .populate("borrower", "name phone")
      .populate("receivedBy", "name email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCollected = await Log.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalCount = await Log.countDocuments(query);

    res.status(200).json({
      logs,
      totalCollected: totalCollected[0]?.total || 0,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching collection logs", error: error.message });
  }
};

// ============ GET BORROWER LOGS (Activity related to a specific borrower) ============

export const getBorrowerLogs = async (req, res) => {
  try {
    const { borrowerId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if borrower exists and user has access
    const borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      return res.status(404).json({ message: "Borrower not found" });
    }

    // Manager can only view their own borrower logs
    if (req.user.role === "Manager" && borrower.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activityLogs = await Log.find({
      type: "Activity",
      ownerType: "Borrower",
      ownerId: borrowerId
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const collectionLogs = await Log.find({
      type: "Collection",
      borrower: borrowerId
    })
      .populate("loan", "amount status")
      .populate("receivedBy", "name email")
      .sort({ timestamp: -1 });

    res.status(200).json({
      borrower: {
        _id: borrower._id,
        name: borrower.name,
        phone: borrower.phone
      },
      activityLogs,
      collectionLogs,
      totalCollected: collectionLogs.reduce((sum, log) => sum + log.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching borrower logs", error: error.message });
  }
};

// ============ GET LOAN LOGS (Activity related to a specific loan) ============

export const getLoanLogs = async (req, res) => {
  try {
    const { loanId } = req.params;

    // Check if loan exists and user has access
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Manager can only view their own loan logs
    if (req.user.role === "Manager" && loan.issuedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const activityLogs = await Log.find({
      type: "Activity",
      ownerType: "Loan",
      ownerId: loanId
    }).sort({ timestamp: -1 });

    const collectionLogs = await Log.find({
      type: "Collection",
      loan: loanId
    })
      .populate("receivedBy", "name email")
      .sort({ timestamp: -1 });

    res.status(200).json({
      loan: {
        _id: loan._id,
        amount: loan.amount,
        status: loan.status
      },
      activityLogs,
      collectionLogs,
      totalCollected: collectionLogs.reduce((sum, log) => sum + log.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching loan logs", error: error.message });
  }
};

// ============ HELPER: Create Activity Log ============

export const createActivityLog = async (ownerType, ownerId, action, details) => {
  try {
    await Log.create({
      type: "Activity",
      ownerType,
      ownerId,
      action,
      details
    });
  } catch (error) {
    console.error("Error creating activity log:", error);
  }
};

// ============ HELPER: Create Collection Log ============

export const createCollectionLog = async (amount, loanId, borrowerId, receivedBy, receivedByRole) => {
  try {
    await Log.create({
      type: "Collection",
      amount,
      loan: loanId,
      borrower: borrowerId,
      receivedBy,
      receivedByRole,
      ownerType: receivedByRole,
      ownerId: receivedBy
    });
  } catch (error) {
    console.error("Error creating collection log:", error);
  }
};

// ============ GET ACTIVITY SUMMARY ============

export const getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {
      type: "Activity",
      ownerType: req.user.role,
      ownerId: req.user.id
    };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const summary = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalActivities = await Log.countDocuments(query);

    res.status(200).json({
      totalActivities,
      breakdown: summary
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity summary", error: error.message });
  }
};

// ============ GET COLLECTION SUMMARY ============

export const getCollectionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {
      type: "Collection",
      receivedBy: req.user.id
    };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const summary = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" }
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    const totalCollected = await Log.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      totalCollected: totalCollected[0]?.total || 0,
      monthlyBreakdown: summary
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching collection summary", error: error.message });
  }
};