import bcrypt from "bcryptjs";
import Manager from "../models/manager.model.js";
import Borrower from "../models/borrower.model.js";
import Loan from "../models/loan.model.js";
import Repayment from "../models/repayment.model.js";

export const getManagerProfile = async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id)
        .select("-password")
        .populate("borrowers", "name phone")
        .populate("loanIssued");

        if (!manager) {
            return res.status(404).json({ message: "Manager not found" });
        }

        res.status(200).json(manager)
    
    } catch (error) {
        res.status(500).json({ message: "Error fetching manager", error: error.message });
    }
}

export const getManagerPortfolioStats = async(req, res) => {
    try {
        const loans = await Loan.find({ issuedBy: req.user.id })
        .populate("borrower", "name phone");

        const borrowers = await Borrower.find({ addedBy: req.user.id });
        const repayments = await Repayment.find({ receivedBy: req.user.id }); 

        // calculate stats
        const totalLoans = loans.length
        const activeLoans = loans.filter(l => l.status === "active").length;
        const overdueLoans = loans.filter(l => l.status === "overdue").length;
        const closedLoans = loans.filter(l => l.status === "closed").length;

        const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0)
        const totalRepaid = repayments.reduce((sum, payment) => sum + payment.amount, 0)
    
        // this month's collection calculations:
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const thisMonthsCollections = repayments.filter(r => {
            const paymentDate = new Date(r.date)
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        }).reduce((sum, payment) => sum + payment.amount, 0)

        // recent activities
        const recentLoans = loans.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

        const recentPayments = repayments.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

        res.status(200).json({
            summary: {
                totalBorrowers: borrowers.length,
                totalLoans,
                activeLoans,
                overdueLoans,
                closedLoans,
                totalLoaned,
                totalRepaid,
                outstanding: totalLoaned - totalRepaid,
                thisMonthsCollections,
                collectionRate: totalLoaned > 0 ? ((totalRepaid / totalLoaned) * 100).toFixed(2) : 0
            },
            recentActivity: {
                recentLoans,
                recentPayments
            }
        })
    
    } catch (error) {
        res.status(500).json({ message: "Error fetching manager stats", error: error.message });
    }
}

export const getManagerOverdueLoans = async (req, res) => {
    try {
        const overdueLoans = await Loan.find({
            issuedBy: req.user.id,
            status: "overdue"
        })
        .populate("borrower", "name phone permanentAddress alternatePhone")
        .populate("repayments")
        .sort({ dueDate: 1})

        // add days overdue to each loan
        const loansWithOverdueDays = overdueLoans.map(loan => {
            const dueDate = new Date(loan.dueDate)
            const today = new Date()
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))

            const totalPaid = loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
            const totalDue = loan.amount + (loan.amount * loan.interestRate / 100)

            return {
                ...loan.toObject(),
                daysOverdue,
                totalPaid,
                totalDue,
                outstanding: totalDue - totalPaid
            }
        })

        res.status(200).json({
            count: overdueLoans.length,
            loans: loansWithOverdueDays
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching overdue loans", error: error.message });
    }
}

export const getManagerBorrowers = async (req, res) => {
    try {
        const { search, hasActiveLoans } = req.query

        let query = { addedBy: req.user.id }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }

        const borrowers = await Borrower.find(query)
            .populate("loans")
            .sort({ createdAt: -1 });

        // filter by active loans (if required)
        let filteredBorrowers = borrowers
        if (hasActiveLoans === "true") {
            filteredBorrowers = borrowers.filter(b =>
                b.loans.some(loan => loan.status === "active" || loan.status === "overdue")
            )
        }

        res.status(200).json({
            count: filteredBorrowers.length,
            borrowers: filteredBorrowers
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching borrowers", error: error.message }); 
    }
}

export const getManagerBorrowersById = async (req, res) => {
    try {
        const borrower = await Borrower.findOne({ 
            _id: req.params.id,
            addedBy: req.user.id
        })
        .populate({
            path: "loans",
            populate: { path: "repayments" }
        })

        if (!borrower) {
            return res.status(404).json({ message: "Borrower not found" });
        }

        // calc borrower stats
        const totalLoans = borrower.loans.length
        const totalBorrowed = borrower.loans.reduce((sum, loan) => sum + loan.amount, 0)
        const totalRepaid = borrower.loans.reduce((sum, loan) => {
            return sum + (loan.repayments?.reduce((pSum, p) => pSum + p.amount, 0) || 0)
        }, 0)
        const activeLoans = borrower.loans.filter(l => l.status === "active").length;
        const overdueLoans = borrower.loans.filter(l => l.status === "overdue").length;
        const closedLoans = borrower.loans.filter(l => l.status === "closed").length;

        res.status(200).json({
            borrower,
            statistics: {
                totalLoans,
                totalBorrowed,
                totalRepaid,
                outstanding: totalBorrowed - totalRepaid,
                activeLoans,
                overdueLoans,
                closedLoans
            }
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching borrower", error: error.message });
    }
}

export const getManagerIssuedLoans = async (req, res) => {
    try {
        const { status, borrowerId, startDate, endDate } = req.query
        let query = { issuedBy: req.user.id }

        if (status) query.status = status
        if (borrowerId) query.borrower = borrowerId

        if (startDate && endDate) {
            query.startDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }

        const loans = await Loan.find(query)
            .populate("borrower", "name phone")
            .populate("repayments")
            .sort({ createdAt: -1 })

        res.status(200).json({
            count: loans.length,
            loans
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching issued loans", error: error.message });
    }
}

export const getManagerIssuedLoansById = async (req, res) => { 
    try {
        const loan = await Loan.findOne({
            _id: req.params.id,
            issuedBy: req.user.id
        })
        .populate("borrower", "name phone")
        .populate({
            path: "repayments",
            populate: { path: "receivedBy", select: "name email" }
        })
        .populate("issuedBy", "name email")

        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        res.status(200).json(loan)

    } catch (error) {
        res.status(500).json({ message: "Error fetching loan", error: error.message });
    }
}

export const getManagerCollections = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query
        let query = { receivedBy: req.user.id }
        
        if (status) query.status = status

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }
        
        const payments = await Repayment.find(query)
        .populate("loan", "amount status")
        .populate("borrower", "name phone")
        .sort({ date: -1 })

        const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0)

        const byMethod = {}
        payments.forEach(p => {
            const method = "cash"
            if (!byMethod[method]) {
                byMethod[method] = {amount: 0, count: 0}
            }
            byMethod[method].amount += p.amount
            byMethod[method].count += 1
        })

        res.status(200).json({
            totalCollected,
            paymentCount: payments.length,
            byMethod,
            payments
        })

    } catch (error) {
        res.status(500).json({ message: "Error fetching manager collections", error: error.message });
    }
}

export const getManagerActivityLogs = async(req, res) => {
    try {
        const { limit = 50 } = req.query

        const manager = await Manager.findById(req.user.id).select("activityLogs")
        if (!manager) {
            return res.status(404).json({ message: "Manager not found" });
        }

        const logs = manager.activityLogs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, parseInt(limit))
        
        res.status(200).json(logs)

    } catch (error) {
        res.status(500).json({ message: "Error fetching activity logs", error: error.message });
    }
}