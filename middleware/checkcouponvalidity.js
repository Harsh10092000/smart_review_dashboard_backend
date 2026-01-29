
import { db } from "../connect.js";

export const checkCouponStatus = (req,res, next) => {
    const updateData =
      "update pro_listing_coupon_module set coupon_status = 0 where DATEDIFF(coupon_valid_till, CONVERT_TZ(NOW(), '+00:00', '+05:30')) = 0 ;";
    db.query(updateData, (err, data) => {
      if (err) return res.status(500).json(err);
      next();
    });
  };