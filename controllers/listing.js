import { db } from "../connect.js";
import "dotenv/config";

export const getPropertiesByUserId = (req, res) => {
    //await verifyJwt(req,res);
    const q = `
      SELECT *
  FROM 
      property_module
  where pro_user_id = ?
  ORDER BY 
      property_module.last_updated DESC;
      `;
    db.query(q, [req.params.userId], (err, data) => {
      if (err) return res.status(500).json(err);
  
      return res.status(200).json(data);
    });
};

export const getPropertyById = (req, res) => {
    //await verifyJwt(req,res);
    const q = `
      SELECT *
  FROM 
      property_module
  where pro_id = ?
  ORDER BY 
      property_module.pro_id DESC;
      `;
    db.query(q, [req.params.proId], (err, data) => {
      if (err) return res.status(500).json(err);
  
      return res.status(200).json(data);
    });
};

export const deleteProperty = (req, res) => {
    const propertyId = req.params.propertyId;
    
    // Delete query that also removes associated images
    const q = `
        DELETE property_module.*, property_module_images.* 
        FROM property_module 
        LEFT JOIN property_module_images 
        ON property_module_images.img_cnct_id = property_module.pro_id 
        WHERE property_module.pro_id = ?
    `;
    
    db.query(q, [propertyId], (err, data) => {
        if (err) {
            console.error("Error deleting property:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Failed to delete property",
                error: err.message 
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Property deleted successfully"
        });
    });
};

export const updateProperty = (req, res) => {
    const propertyId = req.params.propertyId;

    // First get the existing listing_id
    db.query('SELECT listing_id FROM property_module WHERE pro_id = ?', [propertyId], (err, result) => {
        if (err) {
            console.error("Error fetching listing_id:", err);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ success: false, error: "Property not found" });
        }

        const listingId = result[0].listing_id;
        const {
            adType,
            propertyType,
            propertySubType,
            plotNumber,
            state,
            city,
            subDistrict,
            locality,
            completeAddress,
            pinCode,
            coverImage,
            otherImages,
            ownership,
            authority,
            plotSize,
            plotSizeUnit,
            roadWidth,
            roadWidthUnit,
            plotWidth,
            plotLength,
            bedrooms,
            bathrooms,
            balcony,
            facing,
            facingRoadWidth,
            facingRoadUnit,
            amount,
            negotiable,
            rented,
            corner,
            desc,
            otherRooms,
            facilities,
            age,
            floor,
            parking,
            furnishing
        } = req.body;

        // Function to sanitize URL components with better space handling
        const sanitize = (input) => {
            if (!input) return "";
            return input.toString()
                .toLowerCase()
                // First replace spaces with hyphens
                .replace(/\s+/g, "-")
                // Then replace any remaining special characters
                .replace(/[.,]+/g, "-")
                // Remove any duplicate hyphens
                .replace(/-+/g, "-")
                // Remove hyphens from start and end
                .replace(/^-+|-+$/g, "");
        };

        // Construct the URL with existing listing_id
        const url = `${sanitize(plotSize)}-${sanitize(plotSizeUnit)}-${sanitize(propertySubType.split(',')[0])}-for-${sanitize(adType)}-in-${sanitize(city)}-${listingId}`;

        // Update the SQL query to include last_updated timestamp
        const q = `
            UPDATE property_module SET
                pro_ad_type = ?,
                pro_type = ?,
                pro_sub_cat = ?,
                pro_plot_no = ?,
                pro_state = ?,
                pro_city = ?,
                pro_sub_district = ?,
                pro_locality = ?,
                pro_street = ?,
                pro_pincode = ?,
                pro_cover_image = ?,
                pro_other_images = ?,
                pro_ownership_type = ?,
                pro_approval = ?,
                pro_area_size = ?,
                pro_area_size_unit = ?,
                pro_facing_road_width = ?,
                pro_facing_road_unit = ?,
                pro_width = ?,
                pro_length = ?,
                pro_bedroom = ?,
                pro_washrooms = ?,
                pro_balcony = ?,
                pro_facing = ?,
                pro_amt = ?,
                pro_negotiable = ?,
                pro_rental_status = ?,
                pro_corner = ?,
                pro_desc = ?,
                pro_other_rooms = ?,
                pro_near_by_facilities = ?,
                pro_url = ?,
                pro_age = ?,
                pro_floor = ?,
                pro_parking = ?,
                pro_furnishing = ?,
                last_updated = CURRENT_TIMESTAMP,
                pro_listed= "1"
            WHERE pro_id = ?
        `;

        // Update values array to include new fields
        const values = [
            adType,
            propertyType,
            propertySubType,
            plotNumber,
            state,
            city,
            subDistrict,
            locality,
            completeAddress,
            pinCode,
            coverImage,
            JSON.stringify(otherImages),
            ownership,
            authority,
            plotSize,
            plotSizeUnit,
            roadWidth,
            roadWidthUnit,
            plotWidth,
            plotLength,
            // Convert string numbers to integers with default 0
            parseInt(bedrooms || '0'),
            parseInt(bathrooms || '0'),
            parseInt(balcony || '0'),
            facing,
            amount,
            negotiable === 'Yes' ? 'Yes' : 'No',
            rented === 'Yes' ? 'Yes' : 'No',
            corner === 'Yes' ? 'Yes' : 'No',
            desc || '',
            JSON.stringify(otherRooms || []),
            JSON.stringify(facilities || []),
            url,
            // Add new fields
            age || '',
            parseInt(floor || '0'),
            parseInt(parking || '0'),
            furnishing || '',
            propertyId
        ];

        db.query(q, values, (err, data) => {
            if (err) {
                console.error("Error updating property:", err);
                return res.status(500).json({ success: false, error: err.message });
            }

            return res.status(200).json({
                success: true,
                message: "Property updated successfully",
                data: data,
                url: url
            });
        });
    });
};