import express from "express";
import { getUsers, getUser, updateUserStatus } from "../controllers/users.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id/status", updateUserStatus);

export default router;
