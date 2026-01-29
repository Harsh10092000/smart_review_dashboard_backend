import express from "express";
import { assignPlan, getUserSubscription } from "../controllers/subscription.js";
import { verifyToken } from "../controllers/auth.js"; // Assuming this exists or I'll use checkSession logic

const router = express.Router();

// Admin routes (should be protected by admin middleware in real app)
router.post("/assign", assignPlan);
router.get("/user/:userId", getUserSubscription);

// User routes
router.get("/current", verifyToken, getUserSubscription);

export default router;
