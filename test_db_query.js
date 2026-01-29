import { db } from "./connect.js";

const q = `
    SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, 
           bp.business_name, bp.business_type, bp.city, bp.state, bp.slug, bp.subdomain 
    FROM users u 
    LEFT JOIN business_profiles bp ON u.id = bp.user_id 
    ORDER BY u.created_at DESC
`;

console.log("Running Query...");
db.query(q, (err, data) => {
    if (err) {
        console.error("QUERY FAILED:", err);
    } else {
        console.log("QUERY SUCCESS. Row Count:", data.length);
        if (data.length > 0) console.log("First Row:", data[0]);
    }
    process.exit();
});
