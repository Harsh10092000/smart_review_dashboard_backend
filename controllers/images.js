import { db } from "../connect.js";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Auto-create table on first use
const ensureTable = () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS business_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            business_id INT NOT NULL,
            user_id INT NOT NULL,
            filename VARCHAR(255) NOT NULL,
            url VARCHAR(500) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_business_id (business_id),
            INDEX idx_user_id (user_id)
        )
    `;
    db.query(sql, (err) => {
        if (err) console.error("Error creating business_images table:", err);
    });
};
ensureTable();

// Upload a review image (self — logged-in user)
export const uploadImage = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!req.file) return res.status(400).json({ message: "No image uploaded" });

        const [profiles] = await db.promise().query(
            "SELECT id, business_name FROM business_profiles WHERE user_id = ?",
            [userId]
        );
        if (profiles.length === 0) return res.status(404).json({ message: "Business profile not found" });

        const businessId = profiles[0].id;

        // Generate a compressed jpg filename based on business name for SEO
        const businessName = profiles[0].business_name || "business";
        const businessSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${businessSlug}-bizease-${Date.now()}.jpg`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/review-images');
        const filepath = path.join(uploadDir, filename);

        // Ensure directory exists (memoryStorage doesn't auto-create it)
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Process and compress image buffer using sharp
        await sharp(req.file.buffer)
            .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }) // reasonable max dimensions
            .jpeg({ quality: 80, mozjpeg: true }) // Fast, high-quality, universally supported
            .toFile(filepath);

        const url = `/uploads/review-images/${filename}`;

        await db.promise().query(
            "INSERT INTO business_images (business_id, user_id, filename, url) VALUES (?, ?, ?, ?)",
            [businessId, userId, filename, url]
        );

        const [inserted] = await db.promise().query(
            "SELECT * FROM business_images WHERE user_id = ? ORDER BY id DESC LIMIT 1",
            [userId]
        );

        return res.status(201).json({ success: true, image: inserted[0] });
    } catch (error) {
        console.error("Upload image error:", error);
        return res.status(500).json({ message: "Failed to upload image" });
    }
};

// Admin: Upload image for a specific userId (used during demo user creation)
export const adminUploadImage = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        if (!targetUserId) return res.status(400).json({ message: "userId required" });
        if (!req.file) return res.status(400).json({ message: "No image uploaded" });

        const [profiles] = await db.promise().query(
            "SELECT id, business_name FROM business_profiles WHERE user_id = ?",
            [targetUserId]
        );
        if (profiles.length === 0) return res.status(404).json({ message: "Business profile not found for this user" });

        const businessId = profiles[0].id;

        // Generate a compressed jpg filename based on business name for SEO
        const businessName = profiles[0].business_name || "business";
        const businessSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${businessSlug}-bizease-${Date.now()}.jpg`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/review-images');
        const filepath = path.join(uploadDir, filename);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Process and compress image buffer using sharp
        await sharp(req.file.buffer)
            .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(filepath);

        const url = `/uploads/review-images/${filename}`;

        await db.promise().query(
            "INSERT INTO business_images (business_id, user_id, filename, url) VALUES (?, ?, ?, ?)",
            [businessId, targetUserId, filename, url]
        );

        const [inserted] = await db.promise().query(
            "SELECT * FROM business_images WHERE user_id = ? ORDER BY id DESC LIMIT 1",
            [targetUserId]
        );

        return res.status(201).json({ success: true, image: inserted[0] });
    } catch (error) {
        console.error("Admin upload image error:", error);
        return res.status(500).json({ message: "Failed to upload image" });
    }
};

// Get all images for the logged-in user's business
export const getImages = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const [images] = await db.promise().query(
            "SELECT * FROM business_images WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );

        return res.json({ success: true, images });
    } catch (error) {
        console.error("Get images error:", error);
        return res.status(500).json({ message: "Failed to fetch images" });
    }
};

// Delete an image by ID
export const deleteImage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const [rows] = await db.promise().query(
            "SELECT * FROM business_images WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        if (rows.length === 0) return res.status(404).json({ message: "Image not found" });

        const image = rows[0];
        const filePath = path.join(process.cwd(), "public", "uploads", "review-images", image.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await db.promise().query("DELETE FROM business_images WHERE id = ?", [id]);
        return res.json({ success: true, message: "Image deleted" });
    } catch (error) {
        console.error("Delete image error:", error);
        return res.status(500).json({ message: "Failed to delete image" });
    }
};
