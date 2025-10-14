import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "receivedByRole" // dynamic: can be Admin or Manager
    },
    receivedByRole: {
        type: String,
        enum: ["Admin", "Manager"]
    },
    loan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan",
        required: true
    },
    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Borrower",
        required: true
    }
}, { timestamps: true });

export default mongoose.model("Repayment", repaymentSchema);