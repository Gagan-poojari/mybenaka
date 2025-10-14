import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connstr = process.env.MONGODB_URI;
        await mongoose.connect(connstr);
        console.log("Database connected");
    } catch (error) {
        console.error("Error connecting to database", error);
    }
}

export default connectDB