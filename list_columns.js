import { db } from "./connect.js";

const q = "SHOW COLUMNS FROM business_profiles";

console.log("--- COLUMNS IN BUSINESS_PROFILES ---");
db.query(q, (err, rows) => {
    if (err) console.error(err);
    else console.log(rows.map(r => r.Field));
    process.exit();
});
