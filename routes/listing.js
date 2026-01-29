import express from "express";
import { getPropertiesByUserId, getPropertyById, updateProperty, deleteProperty } from "../controllers/listing.js";

const router = express.Router();

router.get("/getPropertiesByUserId/:userId", getPropertiesByUserId);
router.get("/getPropertyById/:proId", getPropertyById);
router.put("/updateProperty/:propertyId", updateProperty);
router.delete("/deleteProperty/:propertyId", deleteProperty);

export default router;

