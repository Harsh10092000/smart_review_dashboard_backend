import express from "express";
import { getSuggestions, trackKeyword } from "../controllers/keywords.js";
import { verifyToken } from "../controllers/auth.js";

const router = express.Router();

// Get keyword suggestions (autocomplete)
router.get("/suggestions", verifyToken, getSuggestions);

// Track keyword usage (called after review generation)
router.post("/track", verifyToken, trackKeyword);

export default router;
