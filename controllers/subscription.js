import { db } from "../connect.js";

// Helper to check user limits
export const checkLimit = async (userId, limitKey) => {
    return new Promise((resolve, reject) => {
        const q = `
            SELECT p.limits_config 
            FROM user_subscriptions us
            JOIN plans p ON us.plan_id = p.id
            WHERE us.user_id = ? AND us.status = 'active' 
            AND (us.end_date IS NULL OR us.end_date > NOW())
            LIMIT 1
        `;
        db.query(q, [userId], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return resolve(null); // No active plan

            const limits = typeof results[0].limits_config === 'string'
                ? JSON.parse(results[0].limits_config)
                : results[0].limits_config;

            resolve(limits[limitKey]);
        });
    });
};

export const assignPlan = (req, res) => {
    const { userId, planId, billingCycle } = req.body; // billingCycle: 'monthly', 'yearly', 'lifetime'

    // 1. Get Plan Details
    const qPlan = "SELECT * FROM plans WHERE id = ?";
    db.query(qPlan, [planId], (err, plans) => {
        if (err) return res.status(500).json(err);
        if (plans.length === 0) return res.status(404).json("Plan not found");

        const plan = plans[0];
        let duration = plan.duration_days;
        if (billingCycle === 'yearly') duration = 365;
        if (billingCycle === 'lifetime') duration = 36500; // 100 years

        // Calculate End Date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        // 2. Deactivate old subscriptions
        const qUpdate = "UPDATE user_subscriptions SET status = 'inactive' WHERE user_id = ?";
        db.query(qUpdate, [userId], (err) => {
            if (err) return res.status(500).json(err);

            // 3. Create new subscription
            const qInsert = `
                INSERT INTO user_subscriptions (user_id, plan_id, end_date, status) 
                VALUES (?, ?, ?, 'active')
            `;
            db.query(qInsert, [userId, planId, endDate], (err) => {
                if (err) return res.status(500).json(err);
                return res.status(200).json({ success: true, message: "Plan assigned successfully" });
            });
        });
    });
};

export const getUserSubscription = (req, res) => {
    // SECURITY WARNING: In production, rely only on req.user.id from token!
    // For debugging, we allow query param if token is missing/debugging
    const userId = req.user?.id || req.query.userId;
    console.log("DEBUG: Fetching subscription for User ID:", userId);

    // Fetch LATEST subscription regardless of status
    const q = `
        SELECT us.*, p.name as plan_name, p.limits_config 
        FROM user_subscriptions us
        JOIN plans p ON us.plan_id = p.id
        WHERE us.user_id = ? 
        ORDER BY us.id DESC
        LIMIT 1
    `;

    db.query(q, [userId], (err, data) => {
        if (err) {
            console.error("Subscription Query Error:", err);
            return res.status(500).json(err);
        }

        if (data.length === 0) return res.status(200).json({ active: false });

        const sub = data[0];
        const now = new Date();
        const endDate = sub.end_date ? new Date(sub.end_date) : null;

        // Check if Active BUT Expired
        if (sub.status === 'active' && endDate && endDate < now) {
            console.log(`User ${userId} subscription expired on ${endDate}. Deactivating...`);

            // Lazy Expiry: Update DB to inactive
            db.query("UPDATE user_subscriptions SET status = 'inactive' WHERE id = ?", [sub.id]);

            // Return as inactive
            return res.status(200).json({ active: false });
        }

        // Must be active AND (no end date OR not yet expired)
        if (sub.status === 'active') {
            sub.limits_config = typeof sub.limits_config === 'string'
                ? JSON.parse(sub.limits_config)
                : sub.limits_config;
            return res.status(200).json({ active: true, subscription: sub });
        }

        // If here, status is inactive
        return res.status(200).json({ active: false });
    });
};

// Admin: Get user subscription details
export const getUserSubscriptionDetails = (req, res) => {
    const userId = req.params.userId;
    const q = `
        SELECT us.*, p.name as plan_name, p.price, p.interval_type
        FROM user_subscriptions us
        JOIN plans p ON us.plan_id = p.id
        WHERE us.user_id = ?
        ORDER BY us.id DESC
        LIMIT 1
    `;
    db.query(q, [userId], (err, data) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (data.length === 0) return res.status(200).json({ hasSubscription: false });

        return res.status(200).json({
            hasSubscription: true,
            subscription: data[0]
        });
    });
};

// Admin: Update user subscription
export const updateUserSubscription = (req, res) => {
    const { userId, planId, endDate, status } = req.body;

    if (!userId) return res.status(400).json({ message: "User ID required" });

    // First deactivate all existing subscriptions
    const deactivateQ = "UPDATE user_subscriptions SET status = 'inactive' WHERE user_id = ?";
    db.query(deactivateQ, [userId], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update", error: err });

        // If status is inactive, we're done
        if (status === 'inactive') {
            return res.status(200).json({ success: true, message: "Subscription deactivated" });
        }

        // Create/Update subscription
        const checkQ = "SELECT id FROM user_subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1";
        db.query(checkQ, [userId], (err, existing) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            if (existing.length > 0) {
                // Update existing
                const updateQ = "UPDATE user_subscriptions SET plan_id = ?, end_date = ?, status = ? WHERE id = ?";
                db.query(updateQ, [planId, endDate, status, existing[0].id], (err) => {
                    if (err) return res.status(500).json({ message: "Update failed", error: err });
                    return res.status(200).json({ success: true, message: "Subscription updated" });
                });
            } else {
                // Insert new
                const insertQ = "INSERT INTO user_subscriptions (user_id, plan_id, end_date, status) VALUES (?, ?, ?, ?)";
                db.query(insertQ, [userId, planId, endDate, status], (err) => {
                    if (err) return res.status(500).json({ message: "Insert failed", error: err });
                    return res.status(200).json({ success: true, message: "Subscription created" });
                });
            }
        });
    });
};
