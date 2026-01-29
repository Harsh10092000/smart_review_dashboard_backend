import { db } from "../connect.js";

// Get all users
export const getUsers = (req, res) => {
    const q = `
        SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, 
               bp.business_name, bp.business_type, bp.city, bp.state, bp.slug, bp.subdomain, bp.qr_token, bp.address 
        FROM users u 
        LEFT JOIN business_profiles bp ON u.id = bp.user_id 
        ORDER BY u.created_at DESC
    `;

    db.query(q, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
};

// Get Single User
export const getUser = (req, res) => {
    const userId = req.params.id;

    // User Query
    const userQ = "SELECT id, name, email, phone, is_active, created_at FROM users WHERE id = ?";

    // Profile Query
    const profileQ = "SELECT * FROM business_profiles WHERE user_id = ?";

    db.query(userQ, [userId], (err, userData) => {
        if (err) return res.status(500).json(err);
        if (userData.length === 0) return res.status(404).json("User not found");

        db.query(profileQ, [userId], (err, profileData) => {
            if (err) return res.status(500).json(err);

            return res.status(200).json({
                user: userData[0],
                profile: profileData.length > 0 ? profileData[0] : null
            });
        });
    });
};

// Update user status (Block/Unblock)
export const updateUserStatus = (req, res) => {
    const userId = req.params.id;
    const { is_active } = req.body;

    if (is_active === undefined) {
        return res.status(400).json("Status is required");
    }

    const q = "UPDATE users SET is_active = ? WHERE id = ?";

    db.query(q, [is_active, userId], (err, data) => {
        if (err) return res.status(500).json(err);

        const statusMsg = is_active ? "activated" : "blocked";
        return res.status(200).json(`User has been ${statusMsg}.`);
    });
};
