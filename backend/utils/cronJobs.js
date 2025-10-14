import cron from "node-cron";
import Loan from "../models/loan.model.js";

// Check and update overdue loans daily at midnight
export const startOverdueLoanChecker = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await Loan.updateMany(
        {
          dueDate: { $lt: today },
          status: "active"
        },
        {
          $set: { status: "overdue" }
        }
      );

      console.log(`Cron: Updated ${result.modifiedCount} loans to overdue status`);
    } catch (error) {
      console.error("Cron error:", error.message);
    }
  });

  console.log("Overdue loan checker cron job started");
};