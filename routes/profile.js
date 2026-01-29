import express from "express";
import { getProfile, saveProfile, getPublicProfile } from "../controllers/profile.js";
import { verifyToken } from "../controllers/auth.js";

const router = express.Router();

// Public route (no auth required)
router.get("/public/:slug", getPublicProfile);

// Protected routes - require authentication
router.get("/get", verifyToken, getProfile);
router.post("/save", verifyToken, saveProfile);

export default router;
