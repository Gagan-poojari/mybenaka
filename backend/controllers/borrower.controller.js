import User from "../models/manager.model.js";
import Borrower from "../models/borrower.model.js";

export const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;

        const query = { role: 'user' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('_id name email')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

export const getAllBorrowers = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        let query = {}

        if (status) {
            query.status = status
        }
        const skip = (page - 1) * limit;

        let borrowers = await Borrower.find(query)
            .populate('user', 'name email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        if (search) {
            borrowers = borrowers.filter(borrower =>
                borrower.user?.name.toLowerCase().includes(search.toLowerCase()) ||
                borrower.user?.email.toLowerCase().includes(search.toLowerCase())
            )
        }

        const totalBorrowers = await Borrower.countDocuments(query);

        res.status(200).json({
            success: true,
            count: borrowers.length,
            totalBorrowers,
            page: parseInt(page),
            pages: Math.ceil(totalBorrowers / limit),
            data: borrowers,
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong while getting borrower details",
            error
        })
    }
}

export const getBorrowerById = async (req, res) => {
    try {
        const borrower = await Borrower.findById(req.params.id)
            .populate('user', 'name email')

        if (!borrower) {
            return res.status(400).json({
                success: false,
                message: "Borrower does not exist"
            })
        }

        res.status(200).json({
            success: true,
            data: borrower
        })
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong while getting borrower details",
            error
        })
    }
}

export const createBorrower = async (req, res) => {
    try {
        const { userId, name, email, password, loanAmount, loanTerm, interestRate } = req.body
        let user;

        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "User does not exist"
                })
            }
            const existingBorrower = await Borrower.findOne({ user: userId });
            if (existingBorrower) {
                return res.status(400).json({
                    success: false,
                    message: "User already has a borrower account"
                })
            }
        } else {
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter all fields"
                })
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists"
                })
            }
            user = await User.create({
                name,
                email,
                password,
                role: "user"
            })
        }

        const borrower = await Borrower.create({
            user: user._id,
            loanAmount,
            loanTerm,
            interestRate,
            amountPaid: req.body.amountPaid || 0,
            remainingBalance,
            status: req.body.status || "active"
        })
        await borrower.populate('user', 'name email')

        res.status(200).json({
            success: true,
            message: "Borrower created successfully",
            borrower
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong while creating borrower",
            error
        })
    }
}

export const updateBorrower = async (req, res) => {
    try {
        const { loanAmount, loanTerm, interestRate, amountPaid, remainingBalance, status } = req.body

        const borrower = await Borrower.findById(req.params.id);
        if (!borrower) {
            return res.status(400).json({
                success: false,
                message: "Borrower does not exist"
            })
        }

        if (loanAmount !== undefined) borrower.loanAmount = loanAmount;
        if (loanTerm !== undefined) borrower.loanTerm = loanTerm;
        if (interestRate !== undefined) borrower.interestRate = interestRate;
        if (amountPaid !== undefined) borrower.amountPaid = amountPaid;
        if (remainingBalance !== undefined) borrower.remainingBalance = remainingBalance;
        if (status !== undefined) borrower.status = status;

        if (amountPaid !== undefined && remainingBalance === undefined) {
            borrower.remainingBalance = borrower.loanAmount - amountPaid;
        }

        if (borrower.remainingBalance <= 0) borrower.status = "paid";

        await borrower.save()
        await borrower.populate('user', 'name email')

        res.status(200).json({
            success: true,
            message: "Borrower details updated successfully",
            borrower
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong while updating borrower details",
            error
        })
    }
}

export const deleteBorrower = async (req, res) => {
    try {
        const borrower = await Borrower.findById(req.params.id)
        if (!borrower) {
            return res.status(400).json({
                success: false,
                message: "Borrower does not exist"
            })
        }
        await borrower.deleteOne()
        res.status(200).json({
            success: true,
            message: "Borrower deleted successfully"
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Something went wrong while deleting borrower",
            error
        })
    }
}