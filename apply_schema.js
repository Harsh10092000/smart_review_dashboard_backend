
import mysql from "mysql2/promise";

const dbConfig = {
    host: "193.203.166.208",
    user: "u706648698_review_gen_db",
    password: "2NeB3$eX&",
    database: "u706648698_review_gen_db",
};

const schema = [
    `CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        interval_type VARCHAR(20) NOT NULL, 
        duration_days INT DEFAULT 30,
        limits_config JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        max_uses INT DEFAULT 0,
        used_count INT DEFAULT 0,
        expiry_date TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        plan_id INT NOT NULL,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
];

async function run() {
    let connection;
    try {
        console.log("Connecting to DB...");
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        for (const query of schema) {
            console.log("Executing:", query.substring(0, 50) + "...");
            await connection.execute(query);
        }
        console.log("Schema applied successfully.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (connection) await connection.end();
    }
}

run();
