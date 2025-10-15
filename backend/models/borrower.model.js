import mongoose from "mongoose";

const borrowerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String,
    required: true
  },
  guardianName: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  permanentAddress: {
    type: String,
    required: true
  },
  temporaryAddress: {
    type: String,
    required: true
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

export default mongoose.model("Borrower", borrowerSchema);
