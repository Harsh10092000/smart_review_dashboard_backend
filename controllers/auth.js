import { db } from "../connect.js";
import { transporter } from "../nodemailer.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import "dotenv/config";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "7d";
const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000; // 1 hour in milliseconds

// Middleware: Verify JWT token
export const verifyToken = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Helper: Log security event
const logSecurityEvent = (userId, userType, action, req) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const q = "INSERT INTO security_logs (user_id, user_type, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)";
    db.query(q, [userId, userType, action, ip, userAgent], (err) => {
        if (err) console.error("Security log error:", err);
    });
};

// Helper: Generate JWT and set cookie
const generateTokenAndSetCookie = (user, userType, res) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        type: userType
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return token;
};

// ==================== USER AUTH ====================

// Register new user
export const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        // Check if email already exists
        const checkQ = "SELECT id FROM users WHERE email = ?";
        db.query(checkQ, [email], async (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            if (data.length > 0) {
                return res.status(409).json({ message: "Email already registered" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Insert user
            const insertQ = "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)";
            db.query(insertQ, [name, email, phone || null, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ message: "Registration failed", error: err });

                const userId = result.insertId;

                // Assign Default Free Plan
                const freePlanQ = "SELECT id, duration_days FROM plans WHERE price = 0 AND is_active = TRUE LIMIT 1";
                db.query(freePlanQ, (err, plans) => {
                    if (!err && plans.length > 0) {
                        const plan = plans[0];
                        const endDate = new Date();
                        endDate.setDate(endDate.getDate() + plan.duration_days);

                        const subQ = "INSERT INTO user_subscriptions (user_id, plan_id, end_date, status) VALUES (?, ?, ?, 'active')";
                        db.query(subQ, [userId, plan.id, endDate], (err) => {
                            if (err) console.error("Failed to assign free plan:", err);
                        });
                    }
                });

                logSecurityEvent(userId, "user", "login", req);

                return res.status(201).json({
                    message: "User registered successfully",
                    userId: userId
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const q = "SELECT * FROM users WHERE email = ? AND is_active = TRUE";
        db.query(q, [email], async (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            if (data.length === 0) {
                logSecurityEvent(null, "user", "failed_login", req);
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const user = data[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                logSecurityEvent(user.id, "user", "failed_login", req);
                return res.status(401).json({ message: "Invalid email or password" });
            }

            generateTokenAndSetCookie(user, "user", res);
            logSecurityEvent(user.id, "user", "login", req);

            return res.status(200).json({
                message: "Login successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==================== ADMIN AUTH ====================

// Login admin
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const q = "SELECT * FROM admins WHERE email = ? AND is_active = TRUE";
        db.query(q, [email], async (err, data) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            if (data.length === 0) {
                logSecurityEvent(null, "admin", "failed_login", req);
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const admin = data[0];
            const isPasswordValid = await bcrypt.compare(password, admin.password);

            if (!isPasswordValid) {
                logSecurityEvent(admin.id, "admin", "failed_login", req);
                return res.status(401).json({ message: "Invalid email or password" });
            }

            generateTokenAndSetCookie(admin, "admin", res);
            logSecurityEvent(admin.id, "admin", "login", req);

            return res.status(200).json({
                message: "Login successful",
                user: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==================== COMMON AUTH ====================

// Logout
export const logout = (req, res) => {
    const token = req.cookies.auth_token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            logSecurityEvent(decoded.id, decoded.type, "logout", req);
        } catch (e) {
            // Token might be invalid, still clear cookie
        }
    }

    res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    return res.status(200).json({ message: "Logged out successfully" });
};

// Check session
export const checkSession = (req, res) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Fetch fresh user data
        const table = decoded.type === "admin" ? "admins" : "users";
        const q = `SELECT id, name, email FROM ${table} WHERE id = ? AND is_active = TRUE`;

        db.query(q, [decoded.id], (err, data) => {
            if (err || data.length === 0) {
                return res.status(401).json({ message: "Session invalid" });
            }

            return res.status(200).json({
                user: {
                    ...data[0],
                    type: decoded.type
                }
            });
        });
    } catch (error) {
        return res.status(401).json({ message: "Session expired" });
    }
};

// ==================== PASSWORD RESET ====================

// Forgot password - send reset email
export const forgotPassword = async (req, res) => {
    try {
        const { email, userType = "user" } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const table = userType === "admin" ? "admins" : "users";
        const q = `SELECT id, name, email FROM ${table} WHERE email = ?`;

        db.query(q, [email], async (err, data) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (data.length === 0) {
                // Don't reveal if email exists or not for security
                return res.status(200).json({ message: "If email exists, reset link will be sent" });
            }

            const user = data[0];

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
            const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN);

            // Delete old tokens for this email
            const deleteQ = "DELETE FROM password_resets WHERE email = ?";
            db.query(deleteQ, [email], (err) => {
                if (err) console.error("Delete old tokens error:", err);
            });

            // Insert new reset token
            const insertQ = "INSERT INTO password_resets (email, token, user_type, expires_at) VALUES (?, ?, ?, ?)";
            db.query(insertQ, [email, hashedToken, userType, expiresAt], async (err) => {
                if (err) return res.status(500).json({ message: "Failed to create reset token" });

                // Send reset email
                const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}&type=${userType}`;

                const mailOptions = {
                    from: `"Review Generator" <${process.env.EMAIL}>`,
                    to: email,
                    subject: "Password Reset Request",
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Hi ${user.name},</p>
              <p>You requested to reset your password. Click the button below to proceed:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </div>
          `
                };

                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error("Send mail error:", err);
                        return res.status(500).json({ message: "Failed to send reset email" });
                    }

                    logSecurityEvent(user.id, userType, "password_reset_request", req);
                    return res.status(200).json({ message: "If email exists, reset link will be sent" });
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reset password with token
export const resetPassword = async (req, res) => {
    try {
        const { token, password, userType = "user" } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const q = "SELECT * FROM password_resets WHERE token = ? AND user_type = ? AND expires_at > NOW()";
        db.query(q, [hashedToken, userType], async (err, data) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (data.length === 0) {
                return res.status(400).json({ message: "Invalid or expired reset token" });
            }

            const resetRecord = data[0];
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const table = userType === "admin" ? "admins" : "users";
            const updateQ = `UPDATE ${table} SET password = ? WHERE email = ?`;

            db.query(updateQ, [hashedPassword, resetRecord.email], (err) => {
                if (err) return res.status(500).json({ message: "Failed to update password" });

                // Delete used token
                const deleteQ = "DELETE FROM password_resets WHERE email = ?";
                db.query(deleteQ, [resetRecord.email], (err) => {
                    if (err) console.error("Delete token error:", err);
                });

                // Get user ID for logging
                const getUserQ = `SELECT id FROM ${table} WHERE email = ?`;
                db.query(getUserQ, [resetRecord.email], (err, userData) => {
                    if (!err && userData.length > 0) {
                        logSecurityEvent(userData[0].id, userType, "password_changed", req);
                    }
                });

                return res.status(200).json({ message: "Password reset successful" });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
