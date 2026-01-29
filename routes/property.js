import express from "express";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import { db } from "../connect.js";
import sizeOf from "image-size";
import {
  addProperty,
  quickListing,
  quickListing1,
  fetchPropertyDataById,
  fetchPropertyData,
  fetchExpiredPropertyData,
  updateProperty,
  fetchLatestProperty,
  fetchPropertyDataByCat,
  fetchPropertySubCatNo,
  fetchPropertyDataBySubCat,
  fetchPropertyDataByUserId,
  fetchPropertyDataByUserId1,
  fetchShortListProperty,
  deleteShortlist,
  deleteProperty,
  fetchImagesWithId,
  deletePropertyImages,
  shortlistProperty,
  checkShortlist,
  checkInterested,
  fetchCityNo,
  rentalPropertyTotal,
  rentalProperty,
  SubDistrictData,
  StateCityData,
  fetchLatestPropertyByCat,
  fetchPropertyDataByCatAndCity,
  addOrigin,
  SubDistrictDataByCity,
  fetchSuggestions,
  StateDistinctCityData,
  fetchPropertyDataByCity,
  fetchLatestPropertyByCity,
  fetchLatestPropertyByCat1,
  fetchPropertyDataById1,

  fetchListedPropertyDataById,
  fetchDeListedPropertyDataById,
  fetchSoldOutPropertyDataById,
  
  updateViews,
  updateContacted,
  updateProListingStatus,
  updateProListingMultipleStatus,
  updateSaleStatus,
  updateMultipleSaleStatus,
  fetchPropertiesAddInLast30Days,
  checkPropertyExists,
  salePropertyTotal,
  moreProperties,
  fetchLatestProperty1,
  // fetchViews,
  // fetchResponses,
  fetchLast30DaysListings,
  fetchResponsesByProId,
  fetchRespondentByUser,
  fetchRespondentByPro,
  extendPropertyRenewDate,
  getPropertyById
} from "../controllers/property.js";


const router = express.Router();

let fileArr = [];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/propertyImages");
  },
  filename: (req, file, cb) => {
    let tempName = Date.now() + "-" + file.originalname;
    fileArr.push(tempName);
    cb(null, tempName);
  },
});

const upload = multer({
  storage,
});


const imageResizer = async (inputPath, outputPath) => {
  console.log(inputPath)
  try {
    await sharp(inputPath)
      .resize({ width: 300 })
      .toFormat('webp')
      .composite([
        {
          input: "public/propertyImages/logo_2.png",
          gravity: "southeast",
        },
      ])
      .toFile(outputPath);
  } catch (err) {
    console.error("Error adding watermark:", err);
  }
};

const setWatermark = async (inputPath, outputPath) => {
  console.log(inputPath)
  try {
    await sharp(inputPath)
      .resize({ width: 1000 })
      .composite([
        {
          input: "public/propertyImages/logo_2.png",
          gravity: "southeast",
        },
      ])
      .toFile(outputPath);
  } catch (err) {
    console.error("Error adding watermark:", err);
  }
};

const setWatermarkSmallerSize = async (inputPath, outputPath) => {
  try {
    sharp(inputPath)
      .resize({ width: 1000 })
      .composite([
        {
          input: "public/propertyImages/logo_2.png",
          gravity: "southeast",
        },
      ])
      .toFile(outputPath);
  } catch (err) {
    console.error("Error adding watermark:", err);
  }
};

const deleteOP = (singleFile) => {
  fs.unlinkSync("public/propertyImages/" + singleFile, (err) => {
    if (err) console.log("delete me yeah error h ", err);
    else console.log("Deleted hui hui ", singleFile);
  });
};

router.post("/addPropertyimages", upload.any("files"), (req, res) => {
  console.log("yha h");
  console.log(fileArr);
  fileArr.forEach(async (singleFile) => {
    
    const name = singleFile;
    console.log(name);
    const inputPath = `public/propertyImages//${name}`;
    const path = `public/propertyImages/watermark/${name}`;
    console.log("yha h");
    //setWatermark(inputPath, path);
    sizeOf(inputPath, async (err, dim) => {
      if (dim.height < 120 || dim.width < 320) {
        await setWatermarkSmallerSize(inputPath, path);
      } else {
        await setWatermark(inputPath, path);
      }
    });
    //setTimeout(() => { deleteOP(singleFile) }, 8000);
  });

  //fileArr = [];

  const q =
    "INSERT INTO property_module_images (`img_link`,`img_cnct_id`, `img_user_id`) VALUES ?";
  const values = fileArr.map((item) => [item, req.body.proId, req.body.userId]);
  db.query(q, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    fileArr = [];
    return res.status(200).json("INSERTED SUCCESSFULLY");
  });
});

router.post("/addProperty", addProperty);
router.post("/quickListing", quickListing);
router.post("/quickListing1", quickListing1);

router.put("/updateProperty", updateProperty);
router.post("/addOrigin", addOrigin);
router.get("/fetchPropertyData", fetchPropertyData);


router.get("/fetchPropertyDataById/:proId", fetchPropertyDataById);
router.get("/checkPropertyExists/:proId", checkPropertyExists);

router.get("/fetchLatestProperty", fetchLatestProperty);
router.get("/fetchLatestProperty1", fetchLatestProperty1);

router.get("/fetchPropertyDataByCat/:proType", fetchPropertyDataByCat);
// router.get("/fetchPropertyDataByCatAndCity/:proAd/:proType/:proCity", fetchPropertyDataByCatAndCity);
router.get("/fetchPropertyDataByCatAndCity/:proAd/:proType", fetchPropertyDataByCatAndCity);
router.get("/moreProperties/:proAd", moreProperties);

router.get("/fetchPropertySubCatNo", fetchPropertySubCatNo);
router.get("/fetchPropertyDataBySubCat/:proSubType", fetchPropertyDataBySubCat);
router.get("/fetchPropertyDataByUserId/:userId", fetchPropertyDataByUserId);

router.get("/fetchPropertyDataByUserId1/:userId", fetchPropertyDataByUserId1);
router.get("/fetchExpiredPropertyData/:userId", fetchExpiredPropertyData);
router.get("/fetchListedPropertyDataById/:userId", fetchListedPropertyDataById);
router.get("/fetchDeListedPropertyDataById/:userId", fetchDeListedPropertyDataById);
router.get("/fetchSoldOutPropertyDataById/:userId", fetchSoldOutPropertyDataById);

// router.get("/fetchViews/:userId",  fetchViews);
// router.get("/fetchResponses/:userId",  fetchResponses);
// router.get("/fetchLast30DaysListings/:userId", verifySession, fetchLast30DaysListings);
router.get("/fetchLast30DaysListings/:userId", fetchLast30DaysListings);
router.get("/fetchResponsesByProId/:proId",  fetchResponsesByProId);
router.get("/fetchRespondentByUser/:userId",  fetchRespondentByUser);
router.get("/fetchRespondentByPro/:proId",  fetchRespondentByPro);



router.get("/fetchShortListProperty/:userId",  fetchShortListProperty);
router.get("/fetchImagesWithId/:imgId", fetchImagesWithId);
router.delete("/deleteShortlist/:shortlistId", deleteShortlist);
router.delete("/deleteProperty/:proId", deleteProperty);
router.delete("/deletePropertyImages/:proId", deletePropertyImages);
router.post("/shortlistProperty", shortlistProperty);
router.post("/checkShortlist", checkShortlist);
router.post("/checkInterested", checkInterested);
router.get("/fetchCityNo", fetchCityNo);
router.get("/rentalPropertyTotal", rentalPropertyTotal);
router.get("/salePropertyTotal", salePropertyTotal);

router.get("/rentalProperty/:proType", rentalProperty);
router.get("/SubDistrictData",  SubDistrictData);
router.get("/StateCityData", StateCityData);
router.get("/fetchLatestPropertyByCat/:proType", fetchLatestPropertyByCat);
router.get("/SubDistrictDataByCity/:city", SubDistrictDataByCity);
router.get("/fetchSuggestions/:para", fetchSuggestions);
router.get("/StateDistinctCityData", StateDistinctCityData);
router.get("/fetchPropertyDataByCity/:city", fetchPropertyDataByCity);
router.get("/fetchLatestPropertyByCity/:city", fetchLatestPropertyByCity);
router.get("/fetchPropertyDataById1/:proId", fetchPropertyDataById1);
router.put("/updateViews", updateViews);
router.put("/updateContacted", updateContacted);

router.put("/updateProListingStatus", updateProListingStatus);
router.put("/extendPropertyRenewDate", extendPropertyRenewDate);

router.put("/updateProListingMultipleStatus", updateProListingMultipleStatus);

router.put("/updateSaleStatus", updateSaleStatus);
router.put("/updateMultipleSaleStatus", updateMultipleSaleStatus);

router.get("/fetchPropertiesAddInLast30Days/:userId", fetchPropertiesAddInLast30Days);


router.get("/getPropertyById/:proId", getPropertyById);

export default router;

