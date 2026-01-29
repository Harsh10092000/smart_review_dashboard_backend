import mysql from "mysql2/promise";

const dbConfig = {
    host: "193.203.166.208",
    user: "u706648698_review_gen_db",
    password: "2NeB3$eX&",
    database: "u706648698_review_gen_db",
};

async function addIntervalTypeColumn() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        // Check if column exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'plans' AND COLUMN_NAME = 'interval_type'`,
            [dbConfig.database]
        );

        if (columns.length === 0) {
            console.log("Adding interval_type column to plans table...");
            await connection.execute(
                `ALTER TABLE plans ADD COLUMN interval_type VARCHAR(20) NOT NULL DEFAULT 'monthly' AFTER price`
            );
            console.log("Column added successfully!");
        } else {
            console.log("interval_type column already exists.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (connection) await connection.end();
    }
}

addIntervalTypeColumn();
