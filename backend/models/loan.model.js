import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Borrower",
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "issuedByRole" // dynamic: can be Admin or Manager
  },
  issuedByRole: {
    type: String,
    enum: ["Admin", "Manager"]
  },
  amount: Number,
  interestRate: Number,
  startDate: Date,
  dueDate: Date,
  status: {
    type: String,
    enum: ["active", "closed", "overdue"],
    default: "active"
  },
  payments: [{
    date: Date,
    amount: Number,
    receivedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "receivedByRole" },
    receivedByRole: { type: String, enum: ["Admin", "Manager"] },
  }],
}, { timestamps: true });

export default mongoose.model("Loan", loanSchema);
