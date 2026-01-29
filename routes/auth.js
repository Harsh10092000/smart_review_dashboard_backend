import express from "express";
import {
    registerUser,
    loginUser,
    loginAdmin,
    logout,
    checkSession,
    forgotPassword,
    resetPassword
} from "../controllers/auth.js";

const router = express.Router();

// User routes
router.post("/register", registerUser);
router.post("/login/user", loginUser);

// Admin routes
router.post("/login/admin", loginAdmin);

// Common routes
router.post("/logout", logout);
router.get("/session", checkSession);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
