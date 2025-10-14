import express from "express";
import { login, logout, getCurrentUser } from "../controllers/auth.controller.js";
import { isAuth } from "../middlewares/authorize.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", isAuth, getCurrentUser);

export default authRouter;