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
  alternatePhone: String,
  guardianName: String,
  relationship: String,
  permanentAddress: String,
  temporaryAddress: String,
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
