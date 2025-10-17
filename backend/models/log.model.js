// models/log.model.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Activity", "Collection"],
    required: true
  },
  action: String,

  // For Activity Logs
  details: String,

  // For Collection Logs
  amount: Number,
  loan: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  borrower: { type: mongoose.Schema.Types.ObjectId, ref: "Borrower" },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "receivedByRole" },
  receivedByRole: { type: String, enum: ["Admin", "Manager"] },

  // Who the log belongs to
  ownerType: {
    type: String,
    enum: ["Admin", "Manager", "Borrower", "Loan"],
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "ownerType"
  },

  // Payment metadata (for Collection logs)
  metadata: {
    receiptNumber: String,
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "cheque", "card", "online"]
    },
    transactionId: String,
    chequeNumber: String,
    bankName: String,
    upiId: String,
    notes: String,
    status: {
      type: String,
      enum: ["pending", "cleared", "bounced", "cancelled"],
      default: "cleared"
    },
    bounceReason: String,
    bounceCharges: Number
  },

  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for better performance
logSchema.index({ type: 1, ownerType: 1, ownerId: 1 });
logSchema.index({ type: 1, receivedBy: 1 });
logSchema.index({ type: 1, loan: 1 });
logSchema.index({ type: 1, borrower: 1 });
logSchema.index({ "metadata.receiptNumber": 1 });
logSchema.index({ timestamp: -1 });

export default mongoose.model("Log", logSchema);