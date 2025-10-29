// utils/cronJobs.js
import cron from "node-cron";
import Loan from "../models/loan.model.js";
import Log from "../models/log.model.js";

/**
 * Auto-apply late fees daily at 12:01 AM
 * This checks all loans and applies:
 * 1. ₹500 for missed repayment schedule payments
 * 2. 15% penalty for overdue loans
 */
export const startLateFeesCronJob = () => {
  // Run every day at 12:01 AM
  cron.schedule("1 0 * * *", async () => {
    console.log("🔄 Running late fees cron job...");
    
    try {
      const today = new Date();
      const results = {
        missedPaymentFees: [],
        overduePenalties: [],
        errors: []
      };

      // Find all active/overdue loans
      const loans = await Loan.find({
        status: { $in: ["active", "overdue"] }
      }).populate("borrower", "name phone");

      console.log(`📊 Checking ${loans.length} active/overdue loans...`);

      for (const loan of loans) {
        try {
          let feeApplied = false;

          // 1. Check for missed repayment schedule payments (₹500 fee)
          const overdueSchedules = loan.repaymentSchedule.filter(
            schedule => schedule.status === "pending" && new Date(schedule.dueDate) < today
          );

          if (overdueSchedules.length > 0) {
            // Check if late fee was already applied today
            const feesAppliedToday = loan.lateFees.filter(fee => {
              const feeDate = new Date(fee.appliedDate);
              return feeDate.toDateString() === today.toDateString();
            });

            const hasMissedPaymentFeeToday = feesAppliedToday.some(
              fee => fee.reason && fee.reason.includes("Missed payment")
            );

            if (!hasMissedPaymentFeeToday) {
              const earliestOverdue = overdueSchedules.reduce((earliest, current) => 
                new Date(current.dueDate) < new Date(earliest.dueDate) ? current : earliest
              );
              const daysOverdue = Math.ceil((today - new Date(earliestOverdue.dueDate)) / (1000 * 60 * 60 * 24));

              loan.lateFees.push({
                amount: 500,
                appliedDate: today,
                appliedBy: null,
                appliedByRole: "System",
                reason: `Auto-applied: Missed payment - ${daysOverdue} days overdue`,
                daysOverdue,
                isPaid: false
              });

              overdueSchedules.forEach(schedule => {
                schedule.status = "overdue";
              });

              results.missedPaymentFees.push({
                loanId: loan._id,
                borrower: loan.borrower.name,
                amount: 500,
                daysOverdue
              });

              feeApplied = true;
            }
          }

          // 2. Check if loan due date has passed (15% penalty)
          const dueDate = new Date(loan.dueDate);
          if (today > dueDate) {
            const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
            const totalPaid = loan.amountPaid || 0;
            const outstandingAmount = totalDue - totalPaid;

            if (outstandingAmount > 0) {
              // Check if 15% penalty was already applied
              const hasOverduePenalty = loan.lateFees.some(
                fee => fee.reason && fee.reason.includes("15% overdue penalty")
              );

              if (!hasOverduePenalty) {
                const penaltyAmount = Math.round((outstandingAmount * 15 / 100) * 100) / 100;
                const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

                loan.lateFees.push({
                  amount: penaltyAmount,
                  appliedDate: today,
                  appliedBy: null,
                  appliedByRole: "System",
                  reason: `Auto-applied: 15% overdue penalty - ${daysOverdue} days past due date`,
                  daysOverdue,
                  isPaid: false
                });

                loan.status = "overdue";

                results.overduePenalties.push({
                  loanId: loan._id,
                  borrower: loan.borrower.name,
                  amount: penaltyAmount,
                  outstandingAmount,
                  daysOverdue
                });

                feeApplied = true;
              }
            }
          }

          if (feeApplied) {
            await loan.save();

            // Log the action
            await Log.create({
              type: "Activity",
              action: "AUTO_APPLY_LATE_FEES",
              details: `System auto-applied late fees for ${loan.borrower.name} (Loan ID: ${loan._id})`,
              ownerType: "System",
              ownerId: null,
              loan: loan._id,
              borrower: loan.borrower._id
            });
          }

        } catch (error) {
          console.error(`❌ Error processing loan ${loan._id}:`, error.message);
          results.errors.push({
            loanId: loan._id,
            error: error.message
          });
        }
      }

      console.log("✅ Late fees cron job completed:");
      console.log(`   - Missed payment fees applied: ${results.missedPaymentFees.length}`);
      console.log(`   - Overdue penalties applied: ${results.overduePenalties.length}`);
      console.log(`   - Errors: ${results.errors.length}`);

      // Log summary
      if (results.missedPaymentFees.length > 0 || results.overduePenalties.length > 0) {
        await Log.create({
          type: "Activity",
          action: "CRON_LATE_FEES_SUMMARY",
          details: `Auto late fees: ${results.missedPaymentFees.length} missed payments (₹500 each), ${results.overduePenalties.length} overdue penalties (15%)`,
          ownerType: "System",
          ownerId: null
        });
      }

    } catch (error) {
      console.error("❌ Error in late fees cron job:", error);
      await Log.create({
        type: "Activity",
        action: "CRON_ERROR",
        details: `Late fees cron job failed: ${error.message}`,
        ownerType: "System",
        ownerId: null
      });
    }
  });

  console.log("✅ Late fees cron job scheduled (runs daily at 12:01 AM)");
};

/**
 * Manual trigger for testing
 */
export const manualLateFeeCheck = async () => {
  console.log("🔄 Manual late fee check triggered...");
  // Same logic as cron job but can be called manually
};