import { db } from "./connect.js";

const createTableQuery = `
CREATE TABLE IF NOT EXISTS qr_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    profile_id INT DEFAULT NULL,
    url VARCHAR(500) NOT NULL,
    foreground_color VARCHAR(10) DEFAULT '#000000',
    background_color VARCHAR(10) DEFAULT '#ffffff',
    logo_url TEXT,
    logo_size INT DEFAULT 50,
    size INT DEFAULT 200,
    error_level VARCHAR(5) DEFAULT 'H',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

const run = async () => {
    try {
        console.log("Creating 'qr_configurations' table...");
        await db.promise().query(createTableQuery);
        console.log("Table created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
};

run();
