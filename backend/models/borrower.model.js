import mongoose from "mongoose";
import AccountNo from "../models/accountno.model.js";

const borrowerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  aadharNumber: {
    type: String,
    required: true
  },
  panNumber: {
    type: String,
  },
  chequeNumber: {
    type: String,
  },
  accountNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  photo: {
    type: String,
  },
  alternatePhone: {
    type: String,
  },
  guardianName: {
    type: String,
  },
  guardianPhoto: {
    type: String,
  },
  relationship: {
    type: String,
  },
  permanentAddress: {
    type: String,
  },
  temporaryAddress: {
    type: String,
  },
  addedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: "addedByRole" 
  },
  addedByRole: { 
    type: String, 
    enum: ["Admin", "Manager"] 
  },
  loans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan"
  }]
}, { timestamps: true });

// Pre-save middleware to auto-increment accountNumber
borrowerSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const accountno = await AccountNo.findByIdAndUpdate(
        { _id: 'borrower_account_number' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.accountNumber = accountno.sequence_value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model("Borrower", borrowerSchema);
