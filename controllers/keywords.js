import { db } from "../connect.js";

// Business type specific default suggestions (Rich SEO & Sentiment focused)
const BUSINESS_TYPE_KEYWORDS = {
    restaurant: [
        "best food in {city}", "delicious meals", "amazing ambiance", "quick service",
        "friendly staff", "value for money", "must try in {city}", "authentic taste",
        "fresh ingredients", "cozy atmosphere", "top rated restaurant", "great for families"
    ],
    cafe: [
        "best coffee in {city}", "cozy vibes", "friendly baristas", "great study spot",
        "tasty snacks", "nice ambiance", "quick service", "relaxing atmosphere",
        "good wifi", "fresh pastries", "hidden gem in {city}", "perfect for meetings"
    ],
    salon: [
        "best salon in {city}", "professional styling", "skilled staff", "relaxing experience",
        "clean environment", "latest trends", "premium products", "great haircut",
        "color expert", "friendly team", "highly recommended salon", "best in {city}"
    ],
    spa: [
        "best spa in {city}", "relaxing atmosphere", "skilled therapists", "rejuvenating experience",
        "clean facility", "premium massage", "peaceful environment", "value for money",
        "stress relief", "luxury experience", "calming vibes", "best massage in {city}"
    ],
    clinic: [
        "best clinic in {city}", "expert doctors", "caring staff", "clean facility",
        "minimal wait time", "professional care", "thorough checkup", "modern equipment",
        "friendly nurses", "trusted doctor", "highly recommended clinic", "patient care"
    ],
    real_estate: [
        "best realtor in {city}", "professional agent", "smooth process", "expert guidance",
        "found dream home", "transparent dealing", "responsive team", "great negotiation",
        "knowledgeable agent", "stress-free experience", "highly recommended", "top real estate agency"
    ],
    hotel: [
        "best hotel in {city}", "comfortable stay", "excellent service", "prime location",
        "clean rooms", "friendly staff", "delicious breakfast", "great amenities",
        "peaceful stay", "luxury hotel", "value for money", "highly recommended hotel"
    ],
    retail: [
        "best store in {city}", "great selection", "helpful staff", "quality products",
        "competitive prices", "clean store", "easy returns", "good deals",
        "friendly service", "wide variety", "best shopping in {city}", "highly recommended"
    ],
    fitness: [
        "best gym in {city}", "great equipment", "motivating trainers", "clean facility",
        "flexible timings", "good results", "friendly atmosphere", "value for money",
        "personal attention", "supportive community", "top fitness center", "highly recommended"
    ],
    automotive: [
        "best mechanic in {city}", "reliable service", "honest advice", "fair pricing",
        "quick repair", "professional work", "quality parts", "trustworthy",
        "good communication", "skilled technicians", "highly recommended", "best auto shop"
    ],
    legal: [
        "best lawyer in {city}", "expert legal advice", "professional service", "successful outcome",
        "clear communication", "timely updates", "fair fees", "dedicated team",
        "trustworthy", "highly recommended", "top law firm", "compassionate"
    ],
    cleaning: [
        "best cleaning service in {city}", "thorough cleaning", "professional staff", "punctual service",
        "sparkling clean", "attention to detail", "eco-friendly products", "reliable team",
        "fair pricing", "highly recommended", "best cleaners", "trustworthy"
    ],
    service: [
        "best service in {city}", "professional team", "timely delivery", "quality work",
        "reliable", "fair pricing", "excellent communication", "customer focused",
        "skilled experts", "highly recommended", "top rated service", "trustworthy"
    ],
    other: [
        "great service", "professional team", "quality work", "value for money",
        "highly recommend", "friendly staff", "quick response", "reliable",
        "best in {city}", "top rated", "excellent experience", "trustworthy"
    ]
};

// Generic defaults if nothing matches
const DEFAULT_SUGGESTIONS = [
    "great service",
    "professional",
    "highly recommend",
    "quality",
    "friendly staff",
    "value for money",
    "reliable",
    "excellent"
];

// Helper to replace placeholders like {city}
const formatSuggestion = (text, context) => {
    let formatted = text;
    if (context.city) formatted = formatted.replace(/{city}/g, context.city);
    // If city was not provided but placeholder exists, replace with generic "town" or remove " in {city}"
    formatted = formatted.replace(" in {city}", "").replace("{city}", "town");
    return formatted;
};

// Get keyword suggestions for autocomplete
export const getSuggestions = async (req, res) => {
    try {
        const userId = req.user?.id;
        const query = (req.query.q || "").trim().toLowerCase();

        // Context parameters from frontend
        const businessType = (req.query.businessType || "other").toLowerCase().replace(' ', '_'); // Normalize 'real estate' -> 'real_estate'
        const city = (req.query.city || "").trim();
        const businessName = (req.query.businessName || "").trim();
        const serviceType = (req.query.serviceType || "").trim();

        const context = { city, businessName, serviceType };

        console.log(`[Keywords] getSuggestions - Context:`, { userId, query, businessType, ...context });

        // Deduplication Helper
        const uniqueSet = new Set();
        const finalSuggestions = [];

        const addUnique = (list) => {
            for (const item of list) {
                const normalized = item.toLowerCase().trim();
                // Check against existing normalized values
                if (!uniqueSet.has(normalized)) {
                    uniqueSet.add(normalized);
                    finalSuggestions.push(item); // Keep original casing
                }
            }
        };

        // 1. DYNAMIC SMART SUGGESTIONS (Based on Context)
        const smartSuggestions = [];

        if (businessName) {
            smartSuggestions.push(`${businessName} reviews`);
            smartSuggestions.push(`recommend ${businessName}`);
        }

        if (city) {
            if (serviceType) {
                // Split service type by comma to handle multiple services
                // e.g. "Web Design, SEO" -> "Best Web Design in City", "Best SEO in City"
                const services = serviceType.split(',').map(s => s.trim()).filter(s => s.length > 0);

                // Limit to first 3 services to avoid flooding
                for (const svc of services.slice(0, 3)) {
                    smartSuggestions.push(`best ${svc.toLowerCase()} in ${city}`);
                }
            } else {
                // e.g. "Best Restaurant in New York" (using business type label if no service type)
                const typeLabel = businessType.replace('_', ' ');
                smartSuggestions.push(`best ${typeLabel} in ${city}`);
            }
            smartSuggestions.push(`top rated in ${city}`);
        }

        if (serviceType) {
            const services = serviceType.split(',').map(s => s.trim()).filter(s => s.length > 0);
            for (const svc of services.slice(0, 3)) {
                smartSuggestions.push(`expert ${svc.toLowerCase()}`);
                smartSuggestions.push(`${svc.toLowerCase()} services`);
            }
        }

        // Filter smart suggestions
        if (query) {
            addUnique(smartSuggestions.filter(s => s.toLowerCase().includes(query)));
        } else {
            addUnique(smartSuggestions);
        }

        // 2. USER HISTORY (Personalized)
        if (userId) {
            let historySql = `
                SELECT keyword FROM keyword_history 
                WHERE user_id = ?
            `;
            const params = [userId];

            if (query.length >= 1) {
                historySql += ` AND keyword LIKE ?`;
                params.push(`%${query}%`);
            }

            historySql += ` ORDER BY used_count DESC, last_used DESC LIMIT 6`;

            const [historyResults] = await db.promise().query(historySql, params);
            const historyKeywords = historyResults.map(r => r.keyword);
            addUnique(historyKeywords);
        }

        // 3. BUSINESS TYPE DEFAULTS (Rich Fallback)
        const normalizedType = businessType.replace('realestate', 'real_estate');
        const rawDefaults = BUSINESS_TYPE_KEYWORDS[normalizedType] || BUSINESS_TYPE_KEYWORDS['other'];
        const formattedDefaults = rawDefaults.map(s => formatSuggestion(s, context));

        // Filter by query
        let defaultsToAdd = formattedDefaults;
        if (query.length >= 1) {
            defaultsToAdd = formattedDefaults.filter(d => d.toLowerCase().includes(query));
        }
        addUnique(defaultsToAdd);

        // Limit to 12
        const limitedSuggestions = finalSuggestions.slice(0, 12);

        console.log(`[Keywords] Returning ${limitedSuggestions.length} unique suggestions`);
        return res.status(200).json(limitedSuggestions);
    } catch (err) {
        console.error("Get suggestions error:", err);
        // Fail gracefully with defaults
        return res.status(200).json(DEFAULT_SUGGESTIONS.slice(0, 6));
    }
};

// Track keyword usage (called when review is generated)
export const trackKeyword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { keywords } = req.body; // Can be string or array

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!keywords) {
            return res.status(400).json({ message: "Keywords required" });
        }

        // Handle both string and array
        let keywordList = [];
        if (typeof keywords === 'string') {
            keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        } else if (Array.isArray(keywords)) {
            keywordList = keywords.map(k => k.trim()).filter(k => k.length > 0);
        }

        // Upsert each keyword
        for (const keyword of keywordList) {
            await db.promise().query(`
                INSERT INTO keyword_history (user_id, keyword, used_count, last_used)
                VALUES (?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE used_count = used_count + 1, last_used = NOW()
            `, [userId, keyword.toLowerCase()]);
        }

        return res.status(200).json({ success: true, tracked: keywordList.length });
    } catch (err) {
        console.error("Track keyword error:", err);
        return res.status(500).json({ message: "Failed to track keywords" });
    }
};
