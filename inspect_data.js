import { db } from "./connect.js";

const qUser = "SELECT * FROM users LIMIT 1";
const qProfile = "SELECT * FROM business_profiles LIMIT 1";

console.log("--- USERS TABLE SAMPLE ---");
db.query(qUser, (err, rows) => {
    if (err) console.error(err);
    else console.log(rows[0]);

    console.log("\n--- BUSINESS PROFILES TABLE SAMPLE ---");
    db.query(qProfile, (err, rows) => {
        if (err) console.error(err);
        else console.log(rows[0]);
        process.exit();
    });
});
