import { db } from './connect.js';

const alterQueries = [
    "ALTER TABLE business_profiles ADD COLUMN subdomain VARCHAR(255) UNIQUE DEFAULT NULL",
    "ALTER TABLE business_profiles ADD COLUMN qr_token VARCHAR(255) UNIQUE DEFAULT NULL"
];

const runUpdates = async () => {
    console.log("Starting DB Schema Update...");

    for (const query of alterQueries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(query, (err, result) => {
                    if (err) {
                        // Ignore duplicate column errors
                        if (err.code === 'ER_DUP_FIELDNAME') {
                            console.log(`Column already exists, skipping: ${query}`);
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        console.log(`Executed: ${query}`);
                        resolve(result);
                    }
                });
            });
        } catch (error) {
            console.error(`Error executing query: ${query}`, error);
        }
    }

    console.log("DB Update Finished.");
    process.exit();
};

runUpdates();
