import express from "express";
import {
  fetchAll,
  fetchInterested,
  fetchShorlist,
  grantAccessToListProperty,
  revokeAccessToListProperty,
  addProListingCoupon,
  fetchCouponData,
  fetchCouponDataById,
  updateCouponStatus,
  deleteCoupon,
  updateProListingCoupon,
  fetchCouponCode,
  fetchDefaultInactiveDuration,
  adminLogin,
  checkSession,
  logout,
  sendOtp,
  updatePassword,
  createPlan,
  updatePlan,
  fetchPlans,
  deletePlan,
  createSystemCoupon,
  fetchSystemCoupons,
  deleteSystemCoupon,
  fetchUsersList,
  updateSystemCoupon,
  createDemoUser,
  deleteUser,
  getProfileById,
  getQRConfigById
} from "../controllers/admin.js";
import { deleteProperty } from "../controllers/admin.js";
import { getUserSubscriptionDetails, updateUserSubscription } from "../controllers/subscription.js";
import { checkCouponStatus } from "../middleware/checkcouponvalidity.js";
import { adminUploadImage } from "../controllers/images.js";
import { uploadReviewImage } from "../middleware/upload.js";

const router = express.Router();

router.post("/adminlogin", adminLogin);
router.get("/checkSession", checkSession);
router.post("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/update-password", updatePassword);
router.get("/fetchAll", fetchAll);
router.get("/fetchUsersList", fetchUsersList);
router.delete("/deletePro/:proId", deleteProperty);
router.get("/fetchInterested", fetchInterested);
router.get("/fetchShorlist", fetchShorlist);
router.post("/grantAccessToListProperty", grantAccessToListProperty);
router.put("/revokeAccessToListProperty", revokeAccessToListProperty);

router.post("/addProListingCoupon", addProListingCoupon);
router.get("/fetchCouponData", checkCouponStatus, fetchCouponData);
router.get("/fetchCouponDataById/:couponId", fetchCouponDataById);
router.put("/updateCouponStatus", updateCouponStatus);
router.put("/updateProListingCoupon", updateProListingCoupon);
router.get("/fetchCouponCode/:couponCode", fetchCouponCode);
router.delete("/deleteCoupon/:couponId", deleteCoupon);
router.get("/fetchDefaultInactiveDuration", fetchDefaultInactiveDuration);

// PLANS
router.post("/createPlan", createPlan);
router.put("/updatePlan", updatePlan);
router.get("/fetchPlans", fetchPlans);
router.delete("/deletePlan/:id", deletePlan);

// COUPONS
router.post("/createSystemCoupon", createSystemCoupon);
router.put("/updateSystemCoupon", updateSystemCoupon);
router.get("/fetchSystemCoupons", fetchSystemCoupons);
router.delete("/deleteSystemCoupon/:id", deleteSystemCoupon);

// SUBSCRIPTION MANAGEMENT (Admin)
router.get("/subscription/:userId", getUserSubscriptionDetails);
router.put("/subscription/update", updateUserSubscription);

// DEMO USER
router.post("/createDemoUser", createDemoUser);
router.delete("/deleteUser/:id", deleteUser);

// ADMIN: Upload review image for a specific user
router.post("/users/:userId/images/upload", uploadReviewImage.single('image'), adminUploadImage);

// ADMIN: Get Profile and QR config for a specific user
router.get("/profile/:userId", getProfileById);
router.get("/marketing/qr/:userId", getQRConfigById);

export default router;
