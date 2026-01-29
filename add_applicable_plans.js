import mysql from "mysql2/promise";

const dbConfig = {
    host: "193.203.166.208",
    user: "u706648698_review_gen_db",
    password: "2NeB3$eX&",
    database: "u706648698_review_gen_db",
};

async function addApplicablePlansColumn() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        // Check if column exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'coupons' AND COLUMN_NAME = 'applicable_plans'`,
            [dbConfig.database]
        );

        if (columns.length === 0) {
            console.log("Adding applicable_plans column to coupons table...");
            await connection.execute(
                `ALTER TABLE coupons ADD COLUMN applicable_plans JSON`
            );
            console.log("Column added successfully!");
        } else {
            console.log("applicable_plans column already exists.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (connection) await connection.end();
    }
}

addApplicablePlansColumn();
