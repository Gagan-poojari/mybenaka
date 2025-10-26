// models/loan.model.js - Best of both worlds
import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Borrower",
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "issuedByRole"
  },
  issuedByRole: {
    type: String,
    enum: ["Admin", "Manager"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "closed", "overdue", "written-off"],
    default: "active"
  },
  
  // Payment summary (updated when payments are made via Log collection)
  payments: [{
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currentBalance: {
      type: Number,
      required: true
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receivedByRole"
    },
    receivedByRole: {
      type: String,
      enum: ["Admin", "Manager"]
    }
  }],
  amountPaid: {
    type: Number,
    default: 0
  },

  repaymentSchedule: [{
    dueDate: Date,
    amount: Number,
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending"
    },
    paidDate: Date,
    paidAmount: Number
  }],

  monthlyInstallment: {
    type: Number,
  },

  repaymentDay: {
    type: Number,
  },
  
  // Automatically calculated (set via pre-save hook)
  currentBalance: {
    type: Number,
    default: 0
  },
  
  // Payment tracking info (quick reference)
  lastPaymentDate: Date,
  lastPaymentAmount: Number,
  paymentCount: {
    type: Number,
    default: 0
  },
  
  // Late fees
  lateFees: [{
    amount: {
      type: Number,
      required: true
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "lateFees.appliedByRole"
    },
    appliedByRole: {
      type: String,
      enum: ["Admin", "Manager", "System"]
    },
    reason: String,
    daysOverdue: Number,
    isPaid: {
      type: Boolean,
      default: false
    }
  }],
  
  // Waivers/Discounts
  waivers: [{
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["interest_waiver", "late_fee_waiver", "principal_waiver"],
      required: true
    },
    grantedDate: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "waivers.grantedByRole"
    },
    grantedByRole: {
      type: String,
      enum: ["Admin", "Manager"]
    },
    reason: String
  }],
  
  // Disbursement info
  disbursement: {
    isDisbursed: {
      type: Boolean,
      default: false
    },
    disbursedAmount: Number,
    disbursedDate: Date,
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "disbursement.disbursedByRole"
    },
    disbursedByRole: {
      type: String,
      enum: ["Admin", "Manager"]
    },
    disbursementMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque"]
    },
    transactionId: String
  },
  
  // Guarantor
  guarantor: {
    name: String,
    phone: String,
    address: String,
    relationship: String,
    idProof: String
  },
  
  // Collateral
  collateral: {
    type: String,
    description: String,
    estimatedValue: Number
  },
  
  // Documents
  documents: [{
    documentType: {
      type: String,
      enum: ["agreement", "id_proof", "address_proof", "income_proof", "photo", "collateral", "other"]
    },
    fileName: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "documents.uploadedByRole"
    },
    uploadedByRole: {
      type: String,
      enum: ["Admin", "Manager"]
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
  
}, { 
  timestamps: true
});

// Indexes for better query performance
loanSchema.index({ borrower: 1, status: 1 });
loanSchema.index({ issuedBy: 1, status: 1 });
loanSchema.index({ status: 1, dueDate: 1 });
loanSchema.index({ createdAt: -1 });

// Virtual: Total amount due (principal + interest + late fees - waivers)
loanSchema.virtual("totalDue").get(function() {
  const interest = (this.amount * this.interestRate) / 100;
  const lateFeeTotal = this.lateFees?.reduce((sum, fee) => sum + (fee.isPaid ? 0 : fee.amount), 0) || 0;
  const waiverTotal = this.waivers?.reduce((sum, waiver) => sum + waiver.amount, 0) || 0;
  return this.amount + interest + lateFeeTotal - waiverTotal;
});

// Virtual: Outstanding balance
loanSchema.virtual("outstanding").get(function() {
  return this.totalDue - (this.amountPaid || 0);
});

// Virtual: Interest amount
loanSchema.virtual("interestAmount").get(function() {
  return (this.amount * this.interestRate) / 100;
});

// Virtual: Total late fees
loanSchema.virtual("totalLateFees").get(function() {
  return this.lateFees?.reduce((sum, fee) => sum + (fee.isPaid ? 0 : fee.amount), 0) || 0;
});

// Virtual: Total waivers
loanSchema.virtual("totalWaivers").get(function() {
  return this.waivers?.reduce((sum, waiver) => sum + waiver.amount, 0) || 0;
});

// Pre-save middleware to update currentBalance
loanSchema.pre('save', function(next) {
  const interest = (this.amount * this.interestRate) / 100;
  const lateFees = this.lateFees?.reduce((sum, fee) => sum + (fee.isPaid ? 0 : fee.amount), 0) || 0;
  const waivers = this.waivers?.reduce((sum, w) => sum + w.amount, 0) || 0;
  this.currentBalance = this.amount + interest + lateFees - waivers - (this.amountPaid || 0);
  next();
});

// Ensure virtuals are included when converting to JSON
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

export default mongoose.model("Loan", loanSchema);