import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    contacts: [String],
    managers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager"
    }],
    borrowers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Borrower"
    }],
    loanIssued: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan"
    }]
}, {
    timestamps: true
});

export default mongoose.model("Admin", adminSchema);