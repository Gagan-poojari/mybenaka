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
  aadharNumber: {
    type: String,
    required: true
  },
  panNumber: {
    type: String,
    required: true
  },
  chequeNumber: {
    type: String,
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

export default mongoose.model("Borrower", borrowerSchema);
