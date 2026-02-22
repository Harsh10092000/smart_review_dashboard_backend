import express from "express";
import { getProfile, saveProfile, getPublicProfile, checkSubdomain } from "../controllers/profile.js";
import { uploadImage, getImages, deleteImage } from "../controllers/images.js";
import { verifyToken } from "../controllers/auth.js";
import { upload, uploadReviewImage } from "../middleware/upload.js";

const router = express.Router();

// Public route (no auth required)
router.get("/public/:slug", getPublicProfile);

// Protected routes - require authentication
router.get("/get", verifyToken, getProfile);
router.get("/check-subdomain/:subdomain", verifyToken, checkSubdomain);
router.post("/save", verifyToken, upload.single('logo'), saveProfile);

// Review Image routes
router.post("/images/upload", verifyToken, uploadReviewImage.single('image'), uploadImage);
router.get("/images", verifyToken, getImages);
router.delete("/images/:id", verifyToken, deleteImage);

export default router;
