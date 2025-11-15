import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 10000 }
});

export default mongoose.model("AccountNo", adminSchema);