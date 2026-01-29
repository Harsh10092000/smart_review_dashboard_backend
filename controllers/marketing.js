import { db } from "../connect.js";
import { checkLimit } from "./subscription.js";

export const getQRConfig = async (req, res) => {
    try {
        const userId = req.user.id;
        const q = "SELECT * FROM qr_configurations WHERE user_id = ?";

        const [rows] = await db.promise().query(q, [userId]);

        if (rows.length === 0) {
            // Return default or null
            return res.status(200).json({ config: null });
        }

        return res.status(200).json({ config: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

export const saveQRConfig = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check Plan Limit
        const allowed = await checkLimit(userId, 'qr_generation');
        if (!allowed) {
            return res.status(403).json({ error: "QR Generation is not allowed in your current plan." });
        }

        const {
            url,
            foreground_color,
            background_color,
            logo_url,
            logo_size,
            size,
            error_level
        } = req.body;

        // Check if exists
        const checkQ = "SELECT id FROM qr_configurations WHERE user_id = ?";
        const [rows] = await db.promise().query(checkQ, [userId]);

        if (rows.length > 0) {
            // Update
            const updateQ = `
            UPDATE qr_configurations 
            SET url=?, foreground_color=?, background_color=?, logo_url=?, logo_size=?, size=?, error_level=?, updated_at=NOW()
            WHERE user_id=?
        `;
            await db.promise().query(updateQ, [url, foreground_color, background_color, logo_url, logo_size, size, error_level, userId]);
            return res.status(200).json({ message: "QR Config updated" });
        } else {
            // Insert
            const insertQ = `
            INSERT INTO qr_configurations 
            (user_id, url, foreground_color, background_color, logo_url, logo_size, size, error_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
            await db.promise().query(insertQ, [userId, url, foreground_color, background_color, logo_url, logo_size, size, error_level]);
            return res.status(200).json({ message: "QR Config saved" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};
