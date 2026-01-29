import mysql from "mysql2/promise";

const dbConfig = {
    host: "193.203.166.208",
    user: "u706648698_review_gen_db",
    password: "2NeB3$eX&",
    database: "u706648698_review_gen_db",
};

async function addMissingColumns() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        // Check and add limits_config column
        const [limitsCol] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'plans' AND COLUMN_NAME = 'limits_config'`,
            [dbConfig.database]
        );

        if (limitsCol.length === 0) {
            console.log("Adding limits_config column to plans table...");
            await connection.execute(
                `ALTER TABLE plans ADD COLUMN limits_config JSON AFTER duration_days`
            );
            console.log("limits_config column added!");
        } else {
            console.log("limits_config column already exists.");
        }

        // Check and add duration_days column
        const [durationCol] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'plans' AND COLUMN_NAME = 'duration_days'`,
            [dbConfig.database]
        );

        if (durationCol.length === 0) {
            console.log("Adding duration_days column to plans table...");
            await connection.execute(
                `ALTER TABLE plans ADD COLUMN duration_days INT DEFAULT 30 AFTER interval_type`
            );
            console.log("duration_days column added!");
        } else {
            console.log("duration_days column already exists.");
        }

        console.log("All columns checked/added successfully!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (connection) await connection.end();
    }
}

addMissingColumns();
