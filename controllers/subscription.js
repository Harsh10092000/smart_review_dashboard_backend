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
    const userId = req.params.userId || req.user.id;
    const q = `
        SELECT us.*, p.name as plan_name, p.limits_config 
        FROM user_subscriptions us
        JOIN plans p ON us.plan_id = p.id
        WHERE us.user_id = ? AND us.status = 'active'
        LIMIT 1
    `;
    db.query(q, [userId], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.status(200).json({ active: false });

        const sub = data[0];
        sub.limits_config = typeof sub.limits_config === 'string'
            ? JSON.parse(sub.limits_config)
            : sub.limits_config;

        return res.status(200).json({ active: true, subscription: sub });
    });
};
