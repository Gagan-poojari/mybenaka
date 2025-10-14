import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { authorize } from "../middlewares/authorize.js";
import { getAllBorrowers, 
    getBorrowerById,
    createBorrower,
    updateBorrower,
    deleteBorrower,
    getAllUsers
} from "../controllers/borrower.controller.js";

const borrowerRouter = express.Router();

borrowerRouter.use(verifyToken)

borrowerRouter.get("/users", authorize('admin', 'manager'),  getAllUsers)

borrowerRouter.get('/', authorize('admin', 'manager'), getAllBorrowers);

borrowerRouter.get('/:id', authorize('admin', 'manager'), getBorrowerById);

borrowerRouter.post('/', authorize('admin', 'manager'), createBorrower);

borrowerRouter.put('/:id', authorize('admin', 'manager'), updateBorrower);

borrowerRouter.delete('/:id', authorize('admin', 'manager'), deleteBorrower);

export default borrowerRouter