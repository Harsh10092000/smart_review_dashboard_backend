import express from "express";
import {
    emailConfigSetting,
    emailConfigBroadcastSetting,
    sendEmailPermissions,
    fetchSubscriberList,
    emailConfigSetting2,
    emailGloablSetting,
    fetchSubscriberDataById
} from "../controllers/settings.js";

const router = express.Router();


router.post("/emailConfigSetting", emailConfigSetting);
router.post("/emailConfigSetting2", emailConfigSetting2);
router.post("/emailConfigBroadcastSetting", emailConfigBroadcastSetting);
router.post("/sendEmailPermissions", sendEmailPermissions);
router.get("/fetchSubscriberList", fetchSubscriberList);
router.post("/emailGloablSetting", emailGloablSetting);
router.get("/fetchSubscriberDataById/:subEmail", fetchSubscriberDataById);

export default router;
