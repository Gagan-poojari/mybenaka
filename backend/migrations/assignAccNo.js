import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from "mongoose";
import Borrower from "../models/borrower.model.js";
import AccountNo from "../models/accountno.model.js";
import connectDB from "../configs/db.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root (one level up from migrations folder)
dotenv.config({ path: join(__dirname, '..', '.env') });

// To assign account
const assignAccountNumbers = async () => {
    try {
        // Verify MONGODB_URI is loaded
        if (!process.env.MONGODB_URI) {
            console.error("❌ MONGODB_URI is not defined in .env file");
            console.error("Current directory:", __dirname);
            console.error("Looking for .env at:", join(__dirname, '..', '.env'));
            process.exit(1);
        }

        console.log("✅ Environment variables loaded");
        await connectDB();
        
        // Find all borrowers without account numbers
        const borrowersWithoutAccounts = await Borrower.find({
            accountNumber: { $exists: false }
        }).sort({ createdAt: 1 });

        console.log(`Found ${borrowersWithoutAccounts.length} borrowers without account numbers`);

        if (borrowersWithoutAccounts.length === 0) {
            console.log("All borrowers already have account numbers");
            await mongoose.disconnect();
            process.exit(0);
        }

        // Initialize accountno if it doesn't exist
        let accountno = await AccountNo.findById('borrower_account_number');
        if (!accountno) {
            accountno = await AccountNo.create({
                _id: 'borrower_account_number',
                sequence_value: 10000
            });
            console.log("accountno initialized at 10000");
        }

        // Assign account numbers
        for (const borrower of borrowersWithoutAccounts) {
            accountno = await AccountNo.findByIdAndUpdate(
                { _id: 'borrower_account_number' },
                { $inc: { sequence_value: 1 } },
                { new: true }
            );

            borrower.accountNumber = accountno.sequence_value;
            await borrower.save({ validateBeforeSave: false });

            console.log(`Assigned account number ${accountno.sequence_value} to ${borrower.name}`);
        }

        console.log("✅ Migration completed successfully");
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

assignAccountNumbers();