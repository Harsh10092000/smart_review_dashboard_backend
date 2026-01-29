import { db } from "./connect.js";

const updateTableQuery = `
ALTER TABLE business_profiles
ADD COLUMN qr_config JSON;
`;

const run = async () => {
    try {
        console.log("Adding 'qr_config' column to 'business_profiles'...");
        await db.promise().query(updateTableQuery);
        console.log("Column added successfully!");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'qr_config' already exists.");
            process.exit(0);
        }
        console.error("Error adding column:", err);
        process.exit(1);
    }
};

run();
