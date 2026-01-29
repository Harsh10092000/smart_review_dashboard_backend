import express from "express";
import { getQRConfig, saveQRConfig } from "../controllers/marketing.js";
import { verifyToken } from "../controllers/auth.js";

const router = express.Router();

router.get("/qr", verifyToken, getQRConfig);
router.post("/qr", verifyToken, saveQRConfig);

export default router;
