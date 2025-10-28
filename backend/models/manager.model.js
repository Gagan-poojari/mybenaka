import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
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
    photo: {
        type: String,
    },
    contacts: [String],
    address: {
        type: String,
        required: true
    },
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

export default mongoose.model("Manager", managerSchema);