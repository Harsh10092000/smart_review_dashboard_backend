import { db } from "../connect.js";
import crypto from 'crypto';

// Helper: Generate slug from name
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

// Get user's business profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const [rows] = await db.promise().query(
            "SELECT * FROM business_profiles WHERE user_id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return res.json({ profile: null });
        }

        const row = rows[0];
        const profile = {
            ...row,
            // Parse JSON fields if they are strings (MySQL sometimes returns JSON as strings)
            theme: typeof row.theme === 'string' ? JSON.parse(row.theme) : row.theme,
            headerConfig: typeof row.header_config === 'string' ? JSON.parse(row.header_config) : row.header_config,
            footerConfig: typeof row.footer_config === 'string' ? JSON.parse(row.footer_config) : row.footer_config,
            platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms,
            promptConfig: typeof row.prompt_config === 'string' ? JSON.parse(row.prompt_config) : row.prompt_config,
            // camelCase conversion for legacy fields
            businessName: row.business_name,
            businessType: row.business_type,
            googleMapsLink: row.google_maps_link
        };

        res.json({ profile });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

// Get Public Profile by Slug (For Website)
export const getPublicProfile = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ message: "Slug is required" });
        }

        const [rows] = await db.promise().query(
            "SELECT * FROM business_profiles WHERE slug = ?",
            [slug]
        );

        if (rows.length === 0) {
            // Fallback: Check if it's an ID (for legacy qr codes or testing)
            if (!isNaN(slug)) {
                const [rowsById] = await db.promise().query(
                    "SELECT * FROM business_profiles WHERE user_id = ?",
                    [slug]
                );
                if (rowsById.length > 0) {
                    // Found by ID
                    return sendProfileResponse(res, rowsById[0]);
                }
            }
            return res.status(404).json({ message: "Profile not found" });
        }

        return sendProfileResponse(res, rows[0]);

    } catch (error) {
        console.error("Get public profile error:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

const sendProfileResponse = (res, row) => {
    // Only send public safe data
    const profile = {
        businessName: row.business_name,
        businessType: row.business_type,
        logo: row.logo,
        theme: typeof row.theme === 'string' ? JSON.parse(row.theme) : row.theme,
        headerConfig: typeof row.header_config === 'string' ? JSON.parse(row.header_config) : row.header_config,
        footerConfig: typeof row.footer_config === 'string' ? JSON.parse(row.footer_config) : row.footer_config,
        platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms,
        languagePref: row.language_pref,
        promptConfig: typeof row.prompt_config === 'string' ? JSON.parse(row.prompt_config) : row.prompt_config,
        // Contact info
        address: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        phone: row.phone,
        email: row.email,
        website: row.website,
        googleMapsLink: row.google_maps_link,
        description: row.description,
        keywords: row.keywords
    };

    res.json({ success: true, profile });
};

// Save/Update user's business profile
export const saveProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const {
            businessName,
            businessType,
            slug,
            logo,
            theme,
            headerConfig,
            footerConfig,
            platforms,
            languagePref,
            promptConfig,
            address,
            city,
            state,
            pincode,
            phone,
            email,
            website,
            googleMapsLink,
            description,
            keywords,
            subdomain
        } = req.body;

        if (!businessName) {
            return res.status(400).json({ message: "Business name is required" });
        }

        // Generate slug if not provided, or use provided one
        // Note: In a real app, we should check for slug uniqueness if user is editing it
        let finalSlug = slug;
        if (!finalSlug) {
            finalSlug = generateSlug(businessName) + "-" + userId;
        }

        // Check if profile exists
        const [existing] = await db.promise().query(
            "SELECT id FROM business_profiles WHERE user_id = ?",
            [userId]
        );

        if (existing.length > 0) {
            // Check Subdomain Uniqueness if changed
            if (subdomain) {
                const [dupSub] = await db.promise().query("SELECT id FROM business_profiles WHERE subdomain = ? AND user_id != ?", [subdomain, userId]);
                if (dupSub.length > 0) return res.status(400).json({ message: "Subdomain already taken" });
            }
            // Fetch existing qr_token from DB first
            const [existingProfile] = await db.promise().query("SELECT qr_token FROM business_profiles WHERE user_id = ?", [userId]);

            // Generate QR Token if not exists in DB (150 chars hex = 75 bytes)
            let qrToken = existingProfile[0]?.qr_token || req.body.qr_token;
            if (!qrToken) {
                qrToken = crypto.randomBytes(75).toString('hex');
            }

            // Update existing profile
            await db.promise().query(
                `UPDATE business_profiles SET 
                business_name = ?,
                business_type = ?,
                slug = ?,
                logo = ?,
                theme = ?,
                header_config = ?,
                footer_config = ?,
                platforms = ?,
                language_pref = ?,
                prompt_config = ?,
                address = ?,
                city = ?,
                state = ?,
                pincode = ?,
                phone = ?,
                email = ?,
                website = ?,
                google_maps_link = ?,
                description = ?,
                keywords = ?,
                subdomain = ?,
                qr_token = ?,
                updated_at = NOW()
                WHERE user_id = ?`,
                [
                    businessName,
                    businessType || null,
                    finalSlug,
                    logo || null,
                    JSON.stringify(theme || {}),
                    JSON.stringify(headerConfig || {}),
                    JSON.stringify(footerConfig || {}),
                    JSON.stringify(platforms || []),
                    languagePref || 'English',
                    JSON.stringify(promptConfig || {}),
                    address || null,
                    city || null,
                    state || null,
                    pincode || null,
                    phone || null,
                    email || null,
                    website || null,
                    googleMapsLink || null,
                    description || null,
                    keywords || null,
                    subdomain || null,
                    qrToken,
                    userId
                ]
            );
        } else {
            // Create new profile
            const qrToken = crypto.randomBytes(75).toString('hex');

            await db.promise().query(
                `INSERT INTO business_profiles
                (user_id, business_name, business_type, slug, logo, theme, header_config, footer_config, platforms, language_pref, prompt_config, address, city, state, pincode, phone, email, website, google_maps_link, description, keywords, subdomain, qr_token, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    userId,
                    businessName,
                    businessType || null,
                    finalSlug,
                    logo || null,
                    JSON.stringify(theme || {}),
                    JSON.stringify(headerConfig || {}),
                    JSON.stringify(footerConfig || {}),
                    JSON.stringify(platforms || []),
                    languagePref || 'English',
                    JSON.stringify(promptConfig || {}),
                    address || null,
                    city || null,
                    state || null,
                    pincode || null,
                    phone || null,
                    email || null,
                    website || null,
                    googleMapsLink || null,
                    description || null,
                    keywords || null,
                    subdomain || null,
                    qrToken
                ]
            );
        }

        res.json({ success: true, message: "Profile saved successfully", slug: finalSlug });
    } catch (error) {
        console.error("Save profile error:", error);
        res.status(500).json({ message: "Failed to save profile" });
    }
};
