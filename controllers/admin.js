import { db } from "../connect.js";
import { transporter } from "../nodemailer.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

bcrypt.hash('admin', 10, (err, hash) => {
  console.log(hash);
});

// Helper to get IP address
function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
}

export const adminLogin = (req, res) => {
  const { username, password } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ip = getIp(req);

  const q = "SELECT * FROM admin_login WHERE username = ? AND status = 'active'";
  db.query(q, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });

    if (results.length === 0) {
      // Log failed attempt
      db.query(
        "INSERT INTO admin_login_logs (username, ip_address, user_agent, success) VALUES (?, ?, ?, ?)",
        [username, ip, userAgent, false]
      );
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = results[0];
    let match = false;
    try {
      match = await bcrypt.compare(password, admin.password);
    } catch (compareError) {
      console.error("bcrypt compare failed:", compareError);
      match = false;
    }

    // Log attempt
    db.query(
      "INSERT INTO admin_login_logs (admin_id, username, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?)",
      [admin.id, username, ip, userAgent, match]
    );

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last_login
    db.query("UPDATE admin_login SET last_login = NOW() WHERE id = ?", [admin.id]);

    // Generate JWT token
    const token = jwt.sign({ id: admin.id, username: admin.username }, "your_jwt_secret", { expiresIn: "1d" });

    // Set JWT token as HTTP-only cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Return user info (omit password)
    const { password: _, ...adminData } = admin;
    res.status(200).json({ success: true, admin: adminData });
  });
};

// export const fetchAll = (req, res) => {
//   const q =
//     "SELECT property_module.*,login_module.* from property_module LEFT JOIN login_module ON login_module.login_id = property_module.pro_user_id ORDER BY pro_id DESC";
//   db.query(q, (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).json(data);
//   });
// };

export const fetchAll = (req, res) => {
  const q =
    "SELECT property_module.*,users.* from property_module LEFT JOIN users ON users.id = property_module.pro_user_id ORDER BY pro_id DESC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchUsersList = (req, res) => {
  const q = `
    SELECT u.*, p.name as plan_name, us.status as sub_status, us.end_date as sub_end_date
    FROM users u 
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active' 
    LEFT JOIN plans p ON us.plan_id = p.id 
    ORDER BY u.id DESC
  `;
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const deleteProperty = (req, res) => {
  const q =
    "DELETE property_module.*,property_module_images.* from property_module LEFT JOIN property_module_images ON property_module_images.img_cnct_id = property_module.pro_id WHERE pro_id = ?";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("DELETED");
  });
};
export const fetchInterested = (req, res) => {
  // const q =
  //   "SELECT  property_interest.*, property_module.*, login_module.* FROM property_interest LEFT JOIN login_module ON property_interest.interest_person_id = login_module.login_id left join property_module on property_interest.interest_property_id = property_module.pro_id ORDER BY pro_id DESC";
  const q = "SELECT  property_interest.*, property_module.*FROM property_interest left join property_module on property_interest.interest_property_id = property_module.pro_id ORDER BY pro_id DESC;"

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};











export const fetchShorlist = (req, res) => {
  const q =
    "SELECT  shortlist_module.*, property_module.*, login_module.* FROM shortlist_module LEFT JOIN login_module ON shortlist_module.shortlist_cnct_id = login_module.login_id left join property_module on shortlist_module.shortlist_pro_id = property_module.pro_id ORDER BY pro_id DESC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};



// };


export const grantAccessToListProperty = (req, res) => {
  console.log(req.body)
  const q =
    "UPDATE login_module SET is_lifetime_free = TRUE WHERE login_id = ?";
  const values = [req.body];
  db.query(q, [values], (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    const q1 =
      "INSERT INTO lifetime_access_log (user_id, payment_status) VALUES (?)";
    const values1 = [
      req.body,
      "granted"
    ]
    db.query(q1, [values1], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Added Successfully");
    });
  });
};


export const revokeAccessToListProperty = (req, res) => {
  console.log(req.body)
  const q =
    "UPDATE login_module SET is_lifetime_free = FALSE WHERE login_id = ?";
  const values = [req.body];
  db.query(q, [values], (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    const q1 =
      "INSERT INTO lifetime_access_log (user_id, payment_status) VALUES (?)";
    const values1 = [
      req.body,
      "revoked"
    ]
    db.query(q1, [values1], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Added Successfully");
    });
  });
};



export const addProListingCoupon = (req, res) => {

  const q =
    "INSERT INTO pro_listing_coupon_module ( coupon_code, coupon_name, coupon_amt, coupon_valid_from, coupon_valid_till, coupon_status) Values (?)";
  const values = [
    req.body.pro_coupon_code,
    req.body.pro_coupon_name,
    req.body.pro_coupon_amt,
    req.body.pro_coupon_valid_form,
    req.body.pro_coupon_valid_till,
    "1",
    //req.body.pro_coupon_validity,
    //req.body.pro_coupon_list_no
  ];
  db.query(q, [values], (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    return res.status(200).json("Added Successfully");
  });
};


export const updateProListingCoupon = (req, res) => {
  const q =
    "UPDATE pro_listing_coupon_module SET coupon_code = ?, coupon_name = ?, coupon_amt = ?, coupon_valid_from = ? , coupon_valid_till = ? WHERE coupon_id = ?"
  const values = [
    req.body.pro_coupon_code,
    req.body.pro_coupon_name,
    req.body.pro_coupon_amt,
    req.body.pro_coupon_valid_form,
    req.body.pro_coupon_valid_till,
    req.body.coupon_id,
  ];
  db.query(q, values, (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    return res.status(200).json("Updated Successfully");
  });
};

export const fetchCouponDataById = (req, res) => {
  const q = "SELECT * FROM pro_listing_coupon_module where coupon_id = ?";
  db.query(q, [req.params.couponId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};


export const fetchCouponData = (req, res) => {
  const q = "SELECT pro_listing_coupon_module.*,  IF( DATEDIFF(coupon_valid_till, CONVERT_TZ(NOW(), '+00:00', '+05:30')) = 0, '0', '1') as status FROM pro_listing_coupon_module;";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};


export const deleteCoupon = (req, res) => {
  const q =
    "DELETE pro_listing_coupon_module from pro_listing_coupon_module WHERE coupon_id = ?";
  db.query(q, [req.params.couponId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("DELETED");
  });
};


export const updateCouponStatus = (req, res) => {
  const q = "UPDATE pro_listing_coupon_module SET coupon_status = ? WHERE coupon_id = ?";
  const values = [req.body.coupon_status, req.body.coupon_id];
  db.query(q, values, (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    return res.status(200).json("Updated Successfully");
  });
};


export const fetchCouponCode = (req, res) => {
  const q = "SELECT * FROM pro_listing_coupon_module where coupon_code = ? and coupon_status = 1 and DATEDIFF(coupon_valid_till, CONVERT_TZ(NOW(), '+00:00', '+05:30')) != 0";
  db.query(q, [req.params.couponCode], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};



export const fetchDefaultInactiveDuration = (req, res) => {
  const q = "SELECT * FROM u747016719_propertyease.default_pro_inactive;";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const checkSession = (req, res) => {
  // Check if admin session exists (you can use JWT token or session)
  // For now, we'll check if there's a valid JWT token in cookies/headers
  const token = req.cookies?.adminToken || req.headers?.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No session found" });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, "your_jwt_secret");

    // Get admin data from database
    const q = "SELECT id, username, name, email, created_at, updated_at, last_login, status FROM admin_login WHERE id = ? AND status = 'active'";
    db.query(q, [decoded.id], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: "Admin not found" });
      }

      const admin = results[0];
      res.status(200).json({ success: true, admin });
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid session" });
  }
};

export const logout = (req, res) => {
  // Clear the session/token
  res.clearCookie('adminToken');
  // Do NOT close the DB pool here; it breaks all future queries
  // db.end();
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// Send OTP for password change
export const sendOtp = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Check if admin exists
  const q = "SELECT * FROM admin_login WHERE email = ? OR username = ?";
  db.query(q, [email, email], async (err, admin) => {
    if (err) {
      console.error("Error checking admin:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (admin.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    const insertQ = "INSERT INTO admin_otp (email, otp, expiry_time, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE otp = ?, expiry_time = ?, created_at = NOW()";
    db.query(insertQ, [email, otp, otpExpiry, otp, otpExpiry], async (err) => {
      if (err) {
        console.error("Error storing OTP:", err);
        return res.status(500).json({ success: false, message: "Failed to store OTP" });
      }

      // Send email with OTP
      try {
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Password Change OTP - Landmark Plots Admin",
          html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                                <h2 style="color: #1976d2; margin-bottom: 20px;">Password Change Request</h2>
                                <p style="color: #666; margin-bottom: 20px;">You have requested to change your password. Use the OTP below to complete the process:</p>
                                <div style="background: #1976d2; color: white; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
                                    ${otp}
                                </div>
                                <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
                                <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                            </div>
                        </div>
                    `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);
        res.json({ success: true, message: "OTP sent successfully" });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        res.status(500).json({ success: false, message: "Failed to send OTP email" });
      }
    });
  });
};

// Verify OTP and update password
export const updatePassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  }

  // Verify OTP
  const verifyQ = "SELECT * FROM admin_otp WHERE email = ? AND otp = ? AND expiry_time > NOW() ORDER BY created_at DESC LIMIT 1";
  db.query(verifyQ, [email, otp], async (err, otpData) => {
    if (err) {
      console.error("Error verifying OTP:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (otpData.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateQ = "UPDATE admin_login SET password = ?, updated_at = NOW() WHERE email = ? OR username = ?";
    db.query(updateQ, [hashedPassword, email, email], (err) => {
      if (err) {
        console.error("Error updating password:", err);
        return res.status(500).json({ success: false, message: "Failed to update password" });
      }

      // Delete used OTP
      const deleteQ = "DELETE FROM admin_otp WHERE email = ? AND otp = ?";
      db.query(deleteQ, [email, otp], (err) => {
        if (err) {
          console.error("Error deleting OTP:", err);
        }
        res.json({ success: true, message: "Password updated successfully" });
      });
    });
  });
};



// PLANS
export const createPlan = (req, res) => {
  const { name, price, interval_type, duration_days, limits_config } = req.body;
  const q = "INSERT INTO plans (name, price, interval_type, duration_days, limits_config) VALUES (?)";
  const values = [name, price, interval_type, duration_days, JSON.stringify(limits_config)];
  db.query(q, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ success: true, message: "Plan created" });
  });
};

export const fetchPlans = (req, res) => {
  const q = "SELECT * FROM plans ORDER BY price ASC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    // Parse JSON limits if necessary or let frontend do it
    const plans = data.map(p => ({
      ...p,
      limits_config: typeof p.limits_config === 'string' ? JSON.parse(p.limits_config) : p.limits_config
    }));
    return res.status(200).json(plans);
  });
};

export const deletePlan = (req, res) => {
  const q = "DELETE FROM plans WHERE id = ?";
  db.query(q, [req.params.id], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Plan deleted");
  });
};

export const updatePlan = (req, res) => {
  const { id, name, price, interval_type, duration_days, limits_config } = req.body;
  const q = "UPDATE plans SET name=?, price=?, interval_type=?, duration_days=?, limits_config=? WHERE id=?";
  const values = [name, price, interval_type, duration_days, JSON.stringify(limits_config), id];

  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ success: true, message: "Plan updated" });
  });
};

// COUPONS
export const createSystemCoupon = (req, res) => {
  const { code, discount_type, discount_value, max_uses, valid_from, expiry_date, applicable_plans } = req.body;
  const q = "INSERT INTO coupons (code, discount_type, discount_value, max_uses, valid_from, expiry_date, applicable_plans) VALUES (?)";
  const values = [code, discount_type, discount_value, max_uses, valid_from || new Date(), expiry_date, JSON.stringify(applicable_plans || [])];
  db.query(q, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ success: true, message: "Coupon created" });
  });
};

export const updateSystemCoupon = (req, res) => {
  const { id, code, discount_type, discount_value, max_uses, valid_from, expiry_date, applicable_plans } = req.body;
  const q = "UPDATE coupons SET code=?, discount_type=?, discount_value=?, max_uses=?, valid_from=?, expiry_date=?, applicable_plans=? WHERE id=?";
  const values = [code, discount_type, discount_value, max_uses, valid_from, expiry_date, JSON.stringify(applicable_plans || []), id];

  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ success: true, message: "Coupon updated" });
  });
};

export const fetchSystemCoupons = (req, res) => {
  const q = "SELECT * FROM coupons ORDER BY created_at DESC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    // Parse applicable_plans JSON
    const coupons = data.map(c => ({
      ...c,
      applicable_plans: typeof c.applicable_plans === 'string' ? JSON.parse(c.applicable_plans || '[]') : (c.applicable_plans || [])
    }));
    return res.status(200).json(coupons);
  });
};

export const deleteSystemCoupon = (req, res) => {
  const q = "DELETE FROM coupons WHERE id = ?";
  db.query(q, [req.params.id], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Coupon deleted");
  });
};
