import { db } from "../connect.js";
import { transporter } from "../nodemailer.js";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { checkLimit } from "./subscription.js";

// const jsonData1 = fs.readFileSync("test.json", "utf8");
// const myObject = JSON.parse(jsonData1);
// console.log(myObject, myObject.intents);

// const dataToWrite = {
//   tag: "properties detail",
//   patterns: ["tell me about all properties"],
//   responses: ["Property is inkkr of price 3000 867989769"],
//   context: [""],
// };

export const addProperty = async (req, res) => {

  try {
    const maxPlatforms = await checkLimit(req.body.pro_user_id, 'platform_limit');
    if (maxPlatforms !== null) {
      const [rows] = await db.promise().query("SELECT COUNT(*) as count FROM property_module WHERE pro_user_id = ?", [req.body.pro_user_id]);
      if (rows[0].count >= maxPlatforms) {
        return res.status(403).json("Listing limit reached for your current plan.");
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }

  const removeDays = "SELECT no_days FROM auroRemoveProperty;"
  db.query(removeDays, (err, data) => {
    if (err) return res.status(500).json(err);
    //return res.status(200).json(data);
    const noDays = data[0]?.no_days || 0;

    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + parseInt(noDays));

    const formattedDate = currentDate.getFullYear() + '-' +
      String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(currentDate.getDate()).padStart(2, '0') + ' ' +
      String(currentDate.getHours()).padStart(2, '0') + ':' +
      String(currentDate.getMinutes()).padStart(2, '0') + ':' +
      String(currentDate.getSeconds()).padStart(2, '0');

    const q =
      "INSERT INTO property_module (pro_user_type, pro_ad_type, pro_type , pro_city, pro_locality, pro_plot_no, pro_street, pro_age, pro_floor, pro_bedroom, pro_washrooms, pro_balcony, pro_parking, pro_facing, pro_area_size, pro_width, pro_length, pro_facing_road_width, pro_open_sides, pro_furnishing, pro_ownership_type, pro_approval, pro_amt, pro_rental_status, pro_desc, pro_possession, pro_sub_cat, pro_user_id,pro_area_size_unit,pro_facing_road_unit,pro_amt_unit,pro_pincode, pro_negotiable,pro_state, pro_sub_district, pro_date, pro_other_rooms, pro_near_by_facilities, pro_corner, pro_renew_date) Values (?)";
    const values = [
      req.body.pro_user_type,
      req.body.pro_ad_type,
      req.body.pro_type,
      req.body.pro_city,
      req.body.pro_locality,

      req.body.pro_plot_no,
      req.body.pro_street,
      req.body.pro_age,
      req.body.pro_floor,
      req.body.pro_bedroom,

      req.body.pro_washrooms,
      req.body.pro_balcony,
      req.body.pro_parking,
      req.body.pro_facing,
      req.body.pro_area_size,

      req.body.pro_width,
      req.body.pro_length,
      req.body.pro_facing_road_width,
      req.body.pro_open_sides,
      req.body.pro_furnishing,

      req.body.pro_ownership_type,
      req.body.pro_approval,
      req.body.pro_amt,
      req.body.pro_rental_status,
      req.body.pro_desc,

      req.body.pro_possession,
      req.body.pro_sub_cat,
      req.body.pro_user_id,
      req.body.pro_area_size_unit,
      req.body.pro_facing_road_unit,

      req.body.pro_amt_unit,
      req.body.pro_pincode,
      req.body.pro_negotiable,
      req.body.pro_state,
      req.body.pro_sub_district,
      req.body.pro_date,
      req.body.pro_other_rooms,
      req.body.pro_near_by_facilities,
      req.body.pro_corner,
      formattedDate
    ];

    let formatted_price = "";

    if (req.body.pro_amt) {
      if (req.body.pro_amt < 100000) {
        formatted_price = Intl.NumberFormat().format(req.body.pro_amt);
      } else if (req.body.pro_amt > 99999 && req.body.pro_amt < 10000000) {
        const lakh_number = req.body.pro_amt / 100000;
        formatted_price = (
          lakh_number.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + " Lacs"
        );
      } else {
        const crore_number = req.body.pro_amt / 10000000;
        formatted_price = (
          crore_number.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + " Crores"
        );
      }
    }


    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      const insertId = data.insertId;


      const sanitize = (input) => input.toLowerCase().replace(/[\s.,]+/g, "-");
      const areaSize = sanitize(req.body.pro_area_size);
      const areaSizeUnit = sanitize(req.body.pro_area_size_unit);
      const propertyType = req.body.pro_type
        ? sanitize(req.body.pro_type.split(",")[0])
        : "";
      const adType = req.body.pro_ad_type === "Rent" ? "rent" : "sale";
      const locality = sanitize(req.body.pro_locality);
      const city = req.body.pro_city
        ? sanitize(req.body.pro_city)
        : sanitize(req.body.pro_state.replaceAll("(", "").replaceAll(")", ""));

      const propertyLink = `${areaSize}-${areaSizeUnit}-${propertyType}-for-${adType}-in-${locality}-${city}-${insertId}`;

      const url =
        areaSize +
        "-" +
        areaSizeUnit +
        "-" +
        propertyType +
        "-for-" +
        adType +
        "-in-" +
        locality +
        "-" +
        city + "-" +
        insertId;


      // const url2 =
      //   req.body.pro_area_size +
      //   "-" +
      //   req.body.pro_area_size_unit
      //     .toLowerCase()
      //     .replaceAll(" ", "-")
      //     .replaceAll(".", "") +
      //   "-" +
      //   (req.body.pro_type
      //     ? req.body.pro_type.split(",")[0].toLowerCase().replaceAll(" ", "-")
      //     : "") +
      //   "-for-" +
      //   (req.body.pro_ad_type === "Rent" ? "rent" : "sale") +
      //   "-in-" +
      //   req.body.pro_locality.trim().toLowerCase().replaceAll(" ", "-") +
      //   "-" +
      //   (req.body.pro_city
      //     ? req.body.pro_city.toLowerCase().replaceAll(" ", "-") + "-"
      //     : req.body.pro_state.toLowerCase().replaceAll(" ", "-") + "-") +
      //   insertId;

      const q = "UPDATE property_module SET pro_url = ? where pro_id = ?";
      const updateValues = [url, insertId];
      db.query(q, updateValues, (err, data) => {
        console.log(updateValues);
        if (err) return res.status(500).json(err);
        const subData =
          "SELECT GROUP_CONCAT( sub_email ) as emails FROM mail_subscriber";
        let emailData = "";

        db.query(subData, (err, subscriberData) => {
          if (err) return res.status(500).json(err);
          subscriberData.map((item) => {
            emailData = item.emails;
          });

          // const imgData =
          //   "SELECT * FROM property_module_images where img_cnct_id = ? limit 1;";

          // db.query(imgData, [insertId], (err, imglink) => {
          //   if (err) return res.status(500).json(err);

          let emails_list = emailData.split(",");

          let info = {
            from: '"Propertyease " <noreply@propertyease.in>', // sender address

            to: "harshgupta.calinfo@gmail.com",
            //to: req.body.pro_user_email,
            subject: `Thanks for your time and trust!`, // Subject line
            html: `<div style="margin:0px;padding:0px;">
     <div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
        <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
           <tbody>
              <tr>
                 <td style="width:700px;display:block;clear:both">
                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">
  
                       <tr style="height:80px; text-align:center;">
                          <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                          </td>
                       </tr>
                 </td>
              </tr>
              <tr>
                 <td>
                    <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">
  
                       <tr>
                          <td>
                             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">
  
                                <tr>
                                   <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom: 10px;"> Dear User,</b>
                                      
                                      <p style="margin-bottom: 10px; font-size: 16px;">Thank you for listing your property on our platform. We look forward to assisting you throughout the process.</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">Check out your property: <a href="https://propertyease.in/${propertyLink}">https://propertyease.in/${propertyLink}</a></p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">You may also contact our support at <a href="https://wa.me/919996716787">+91-99967-16787</a> anytime for any information related to this enquiry.</p>
                                      
                                      </td>
                                </tr>
                                <tr>
                                   <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                         </b></p>
                                      <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                      <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>
  
                                   </td>
                                </tr>
                             </table>
                          </td>
                       </tr>
  
                    </table>
                 </td>
              </tr>
              <tr>
                 <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">
  
                    <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                       &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
                 </td>
              </tr>
  
           </tbody>
        </table>
     </div>
  </div>`,
          };
          let info2 = {
            from: '"Propertyease " <noreply@propertyease.in>', // sender address

            to: "harshgupta.calinfo@gmail.com",
            //to: "sbpb136118@gmail.com,dhamija.piyush7@gmail.com", // list of receivers
            //to: req.body.pro_user_email,
            subject: `Property Id: ${5000 + parseInt(insertId)} ${req.body.pro_user_email
              } listed new Property`, // Subject line
            html: `<div style="margin:0px;padding:0px;">
     <div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
        <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
           <tbody>
              <tr>
                 <td style="width:700px;display:block;clear:both">
                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">
  
                       <tr style="height:80px; text-align:center;">
                          <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                          </td>
                       </tr>
                 </td>
              </tr>
              <tr>
                 <td>
                    <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">
  
                       <tr>
                          <td>
                             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">
  
                                <tr>
                                   <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom: 10px;"> Dear Admin,</b>
                                      
                                      <p style="margin-bottom: 10px; font-size: 16px;">${req.body.pro_user_email
              } has list following Property, Property Id: ${5000 + parseInt(insertId)
              } .</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">Check out the property: <a href="https://propertyease.in/${propertyLink}">https://propertyease.in/${propertyLink}</a></p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">You can Contact him/her on <a href="https://wa.me/${"91" + req.body.pro_login_number
              }">+91-${req.body.pro_login_number
              }</a>.</p>
                                      
                                      </td>
                                </tr>
                                <tr>
                                   <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                         </b></p>
                                      <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                      <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>
  
                                   </td>
                                </tr>
                             </table>
                          </td>
                       </tr>
  
                    </table>
                 </td>
              </tr>
              <tr>
                 <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">
  
                    <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                       &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
                 </td>
              </tr>
  
           </tbody>
        </table>
     </div>
  </div>`,
          };

          transporter.sendMail(info, (err, data) => {
            if (err) return res.status(500).json(err);
            transporter.sendMail(info2, (err, data) => {
              if (err) return res.status(500).json(err);

              const updateq =
                "UPDATE list_plan_transactions SET pro_added_recently = pro_added_recently + 1 where user_id = ? order by tran_id desc limit 1";

              db.query(updateq, [req.body.pro_user_id], (err, data) => {
                if (err) return res.status(500).json(err);
                console.log(
                  "process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME : ",
                  process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME,
                  typeof process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME
                );
                if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {

                  //   digesttransporter.sendMail(info3, (err, data) => {
                  //     if (err) return res.status(500).json(err);
                  //     return res.status(200).json(insertId);
                  // });

                  // const emails_list2 = [
                  //   "harshgupta.calinfo@gmail.com",
                  //   "harshgarg1009@gmail.com",
                  // ];
                  sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                  return res.status(200).json(insertId);
                } else {
                  console.log("3rd block skipped");
                  return res.status(200).json(insertId);
                }
              });
            });
            //return res.status(200).json(insertId);
          });
        });
      });
      // });
    });
  });
};

export const quickListing = (req, res) => {
  const removeDays = "SELECT no_days FROM auroRemoveProperty;"
  db.query(removeDays, (err, data) => {
    if (err) return res.status(500).json(err);
    //return res.status(200).json(data);
    const noDays = data[0]?.no_days || 0;

    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + parseInt(noDays));

    const formattedDate = currentDate.getFullYear() + '-' +
      String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(currentDate.getDate()).padStart(2, '0') + ' ' +
      String(currentDate.getHours()).padStart(2, '0') + ':' +
      String(currentDate.getMinutes()).padStart(2, '0') + ':' +
      String(currentDate.getSeconds()).padStart(2, '0');
    const q =
      "INSERT INTO property_module (  pro_bedroom, pro_washrooms, pro_balcony, pro_parking, pro_floor, pro_open_sides,  pro_user_type, pro_ad_type, pro_type , pro_city, pro_locality, pro_facing, pro_area_size, pro_amt, pro_desc, pro_user_id,pro_area_size_unit,pro_amt_unit,pro_pincode, pro_negotiable,pro_state, pro_sub_district, pro_date, pro_renew_date) Values (?)";

    const values = [
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      req.body.pro_user_type,
      req.body.pro_ad_type,
      req.body.pro_type,
      req.body.pro_city,
      req.body.pro_locality,

      req.body.pro_facing,
      req.body.pro_area_size,

      req.body.pro_amt,

      req.body.pro_desc,
      req.body.pro_user_id,
      req.body.pro_area_size_unit,

      req.body.pro_amt_unit,
      "",
      "",
      req.body.pro_state,
      req.body.pro_sub_district,
      req.body.pro_date,
      formattedDate
    ];

    let formatted_price = "";

    if (req.body.pro_amt) {
      if (req.body.pro_amt < 100000) {
        formatted_price = Intl.NumberFormat().format(req.body.pro_amt);
      } else if (req.body.pro_amt > 99999 && req.body.pro_amt < 10000000) {
        const lakh_number = req.body.pro_amt / 100000;
        formatted_price = (
          lakh_number.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + " Lacs"
        );
      } else {
        const crore_number = req.body.pro_amt / 10000000;
        formatted_price = (
          crore_number.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + " Crores"
        );
      }
    }

    //const newPropety="Property is in "+req.body.pro_city+"of price"+req.body.pro_amt;

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      const insertId = data.insertId;

      const sanitize = (input) => input.toLowerCase().replace(/[\s.,]+/g, "-");

      const areaSize = sanitize(req.body.pro_area_size);
      const areaSizeUnit = sanitize(req.body.pro_area_size_unit);
      const propertyType = req.body.pro_type
        ? sanitize(req.body.pro_type.split(",")[0])
        : "";
      const adType = req.body.pro_ad_type === "Rent" ? "rent" : "sale";
      const locality = sanitize(req.body.pro_locality);
      const city = req.body.pro_city
        ? sanitize(req.body.pro_city)
        : sanitize(req.body.pro_state.replaceAll("(", "").replaceAll(")", ""));

      const propertyLink = `${areaSize}-${areaSizeUnit}-${propertyType}-for-${adType}-in-${locality}-${city}-${insertId}`;

      const url =
        areaSize +
        "-" +
        areaSizeUnit +
        "-" +
        propertyType +
        "-for-" +
        adType +
        "-in-" +
        locality +
        "-" +
        city + "-" +
        insertId;

      const q = "UPDATE property_module SET pro_url = ? where pro_id = ?";
      const updateValues = [url, insertId];
      db.query(q, updateValues, (err, data) => {
        console.log(updateValues);
        if (err) return res.status(500).json(err);
        const subData =
          "SELECT GROUP_CONCAT( sub_email ) as emails FROM mail_subscriber";
        let emailData = "";

        db.query(subData, (err, subscriberData) => {
          if (err) return res.status(500).json(err);
          subscriberData.map((item) => {
            emailData = item.emails;
          });

          // const imgData =
          //   "SELECT * FROM property_module_images where img_cnct_id = ? limit 1;";

          // db.query(imgData, [insertId], (err, imglink) => {
          //   if (err) return res.status(500).json(err);

          let emails_list = emailData.split(",");

          let info = {
            from: '"Propertyease " <noreply@propertyease.in>', // sender address

            //to: "harshgupta.calinfo@gmail.com",
            to: req.body.pro_user_email,
            subject: `Thanks for your time and trust!`, // Subject line
            html: `<div style="margin:0px;padding:0px;">
     <div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
        <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
           <tbody>
              <tr>
                 <td style="width:700px;display:block;clear:both">
                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">
  
                       <tr style="height:80px; text-align:center;">
                          <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                          </td>
                       </tr>
                 </td>
              </tr>
              <tr>
                 <td>
                    <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">
  
                       <tr>
                          <td>
                             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">
  
                                <tr>
                                   <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom: 10px;"> Dear User,</b>
                                      
                                      <p style="margin-bottom: 10px; font-size: 16px;">Thank you for listing your property on our platform. We look forward to assisting you throughout the process.</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">
  Check out your property: 
  <a href="https://propertyease.in/${propertyLink}">${propertyLink}</a>
</p>

                                     
                                    
                                    <p style="margin-bottom: 10px; font-size: 16px;">You may also contact our support at <a href="https://wa.me/919996716787">+91-99967-16787</a> anytime for any information related to this enquiry.</p>
                                      
                                      </td>
                                </tr>
                                <tr>
                                   <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                         </b></p>
                                      <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                      <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>
  
                                   </td>
                                </tr>
                             </table>
                          </td>
                       </tr>
  
                    </table>
                 </td>
              </tr>
              <tr>
                 <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">
  
                    <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                       &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
                 </td>
              </tr>
  
           </tbody>
        </table>
     </div>
  </div>`,
          };
          let info2 = {
            from: '"Propertyease " <noreply@propertyease.in>', // sender address

            //to: "harshgupta.calinfo@gmail.com",
            to: "sbpb136118@gmail.com,dhamija.piyush7@gmail.com", // list of receivers

            subject: `Property Id: ${5000 + parseInt(insertId)} ${req.body.pro_user_email
              } listed new Property`, // Subject line
            html: `<div style="margin:0px;padding:0px;">
     <div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
        <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
           <tbody>
              <tr>
                 <td style="width:700px;display:block;clear:both">
                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">
  
                       <tr style="height:80px; text-align:center;">
                          <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                          </td>
                       </tr>
                 </td>
              </tr>
              <tr>
                 <td>
                    <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">
  
                       <tr>
                          <td>
                             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">
  
                                <tr>
                                   <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom: 10px;"> Dear Admin,</b>
                                      
                                      <p style="margin-bottom: 10px; font-size: 16px;">${req.body.pro_user_email
              } has list following Property, Property Id: ${5000 + parseInt(insertId)
              } .</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">
  Check out your property: 
  <a href="https://propertyease.in/${propertyLink}">${propertyLink}</a>
</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">You can Contact him/her on <a href="https://wa.me/${"91" + req.body.pro_login_number
              }">+91-${req.body.pro_login_number
              }</a>.</p>
                                      
                                      </td>
                                </tr>
                                <tr>
                                   <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                         </b></p>
                                      <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                      <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>
  
                                   </td>
                                </tr>
                             </table>
                          </td>
                       </tr>
  
                    </table>
                 </td>
              </tr>
              <tr>
                 <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">
  
                    <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                       &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
                 </td>
              </tr>
  
           </tbody>
        </table>
     </div>
  </div>`,
          };

          transporter.sendMail(info, (err, data) => {
            if (err) return res.status(500).json(err);
            transporter.sendMail(info2, (err, data) => {
              if (err) return res.status(500).json(err);

              if (req.body.is_lifetime_free == 1) {
                if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
                  //console.log("inside 3rd block");
                  //   digesttransporter.sendMail(info3, (err, data) => {
                  //     if (err) return res.status(500).json(err);
                  //     return res.status(200).json(insertId);
                  // });

                  // const emails_list2 = [
                  //   "harshgupta.calinfo@gmail.com",
                  //   "harshgarg1009@gmail.com",
                  // ];
                  sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                  return res.status(200).json(insertId);
                } else {
                  //console.log("3rd block skipped");
                  return res.status(200).json(insertId);
                }
              } else if (req.body.free_listings_remaining > 0) {
                const updated_free_listings_remaining = req.body.free_listings_remaining - 1;
                const updateq =
                  "UPDATE login_module SET free_listings_remaining = ? where login_id = ?";
                db.query(updateq, [updated_free_listings_remaining, req.body.pro_user_id], (err, data) => {
                  if (err) return res.status(500).json(err);
                  if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
                    sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                    return res.status(200).json(insertId);
                  } else {
                    return res.status(200).json(insertId);
                  }
                });
              } else if (req.body.paid_listings_remaining > 0) {
                const updated_paid_listings_remaining = req.body.paid_listings_remaining - 1;
                let updtaed_plan_status = 0;
                if (updated_paid_listings_remaining == 0) {
                  updtaed_plan_status = 2;
                } else {
                  updtaed_plan_status = 1;
                }
                const updateq =
                  "UPDATE login_module SET paid_listings_remaining = ?, plan_status = ? where login_id = ?";

                db.query(updateq, [updated_paid_listings_remaining, updtaed_plan_status, req.body.pro_user_id], (err, data) => {
                  if (err) return res.status(500).json(err);
                  if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
                    sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                    return res.status(200).json(insertId);
                  } else {
                    return res.status(200).json(insertId);
                  }
                });
              }

              // const updateq =
              //   "UPDATE login_module SET pro_added_recently = pro_added_recently + 1 where user_id = ? order by tran_id desc limit 1";




              // db.query(updateq, [req.body.pro_user_id], (err, data) => {
              //   if (err) return res.status(500).json(err);
              //   // console.log(
              //   //   "process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME : ",
              //   //   process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME,
              //   //   typeof process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME
              //   // );
              //   if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
              //     //console.log("inside 3rd block");
              //     //   digesttransporter.sendMail(info3, (err, data) => {
              //     //     if (err) return res.status(500).json(err);
              //     //     return res.status(200).json(insertId);
              //     // });

              //     // const emails_list2 = [
              //     //   "harshgupta.calinfo@gmail.com",
              //     //   "harshgarg1009@gmail.com",
              //     // ];
              //     sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
              //     return res.status(200).json(insertId);
              //   } else {
              //     //console.log("3rd block skipped");
              //     return res.status(200).json(insertId);
              //   }
              // });
              //});
              //return res.status(200).json(insertId);
            });
          });
        });
      });
    });
  });
};

export const quickListing1 = (req, res) => {
  const removeDays = "SELECT no_days FROM auroRemoveProperty;"
  db.query(removeDays, (err, data) => {
    if (err) return res.status(500).json(err);
    //return res.status(200).json(data);
    const noDays = data[0]?.no_days || 0;

    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + parseInt(noDays));

    const formattedDate = currentDate.getFullYear() + '-' +
      String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(currentDate.getDate()).padStart(2, '0') + ' ' +
      String(currentDate.getHours()).padStart(2, '0') + ':' +
      String(currentDate.getMinutes()).padStart(2, '0') + ':' +
      String(currentDate.getSeconds()).padStart(2, '0');
    const q =
      "INSERT INTO property_module (  pro_bedroom, pro_washrooms, pro_balcony, pro_parking, pro_floor, pro_open_sides,  pro_user_type, pro_ad_type, pro_type , pro_city, pro_locality, pro_facing, pro_area_size, pro_amt, pro_desc, pro_user_id,pro_area_size_unit,pro_amt_unit,pro_pincode, pro_negotiable,pro_state, pro_sub_district, pro_date, pro_renew_date) Values (?)";


    const values = [
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      req.body.pro_user_type,
      req.body.pro_ad_type,
      req.body.pro_type,
      req.body.pro_city,
      req.body.pro_locality,

      req.body.pro_facing,
      req.body.pro_area_size,

      req.body.pro_amt,

      req.body.pro_desc,
      req.body.pro_user_id,
      req.body.pro_area_size_unit,

      req.body.pro_amt_unit,
      "",
      "",
      req.body.pro_state,
      req.body.pro_sub_district,
      req.body.pro_date,
      formattedDate
    ];

    console.log("values : ", values);
    let formatted_price = "";

    if (req.body.pro_amt) {
      if (req.body.pro_amt < 100000) {
        formatted_price = Intl.NumberFormat().format(req.body.pro_amt);
      } else if (req.body.pro_amt > 99999 && req.body.pro_amt < 10000000) {
        const lakh_number = req.body.pro_amt / 100000;
        formatted_price = (
          lakh_number.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + " Lacs"
        );
      } else {
        const crore_number = req.body.pro_amt / 10000000;
        formatted_price = (
          crore_number.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + " Crores"
        );
      }
    }

    //const newPropety="Property is in "+req.body.pro_city+"of price"+req.body.pro_amt;

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      const insertId = data.insertId;

      const sanitize = (input) => input.toLowerCase().replace(/[\s.,]+/g, "-");

      const areaSize = sanitize(req.body.pro_area_size);
      const areaSizeUnit = sanitize(req.body.pro_area_size_unit);
      const propertyType = req.body.pro_type
        ? sanitize(req.body.pro_type.split(",")[0])
        : "";
      const adType = req.body.pro_ad_type === "Rent" ? "rent" : "sale";
      const locality = sanitize(req.body.pro_locality);
      const city = req.body.pro_city
        ? sanitize(req.body.pro_city)
        : sanitize(req.body.pro_state.replaceAll("(", "").replaceAll(")", ""));

      const propertyLink = `${areaSize}-${areaSizeUnit}-${propertyType}-for-${adType}-in-${locality}-${city}-${insertId}`;

      const url =
        areaSize +
        "-" +
        areaSizeUnit +
        "-" +
        propertyType +
        "-for-" +
        adType +
        "-in-" +
        locality +
        "-" +
        city + "-" +
        insertId;

      const q = "UPDATE property_module SET pro_url = ? where pro_id = ?";
      const updateValues = [url, insertId];
      db.query(q, updateValues, (err, data) => {
        console.log(updateValues);
        if (err) return res.status(500).json(err);
        const subData =
          "SELECT GROUP_CONCAT( sub_email ) as emails FROM mail_subscriber";
        let emailData = "";

        db.query(subData, (err, subscriberData) => {
          if (err) return res.status(500).json(err);
          subscriberData.map((item) => {
            emailData = item.emails;
          });

          // const imgData =
          //   "SELECT * FROM property_module_images where img_cnct_id = ? limit 1;";

          // db.query(imgData, [insertId], (err, imglink) => {
          //   if (err) return res.status(500).json(err);

          let emails_list = emailData.split(",");

          let info = {
            from: '"Propertyease " <noreply@propertyease.in>', // sender address

            //to: "harshgupta.calinfo@gmail.com",
            to: req.body.pro_user_email,
            subject: `Thanks for your time and trust!`, // Subject line
            html: `<div style="margin:0px;padding:0px;">
     <div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
        <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
           <tbody>
              <tr>
                 <td style="width:700px;display:block;clear:both">
                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">
  
                       <tr style="height:80px; text-align:center;">
                          <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                          </td>
                       </tr>
                 </td>
              </tr>
              <tr>
                 <td>
                    <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">
  
                       <tr>
                          <td>
                             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">
  
                                <tr>
                                   <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom: 10px;"> Dear User,</b>
                                      
                                      <p style="margin-bottom: 10px; font-size: 16px;">Thank you for listing your property on our platform. We look forward to assisting you throughout the process.</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">
  Check out your property: 
  <a href="https://propertyease.in/${propertyLink}">${propertyLink}</a>
</p>

                                     
                                    
                                    <p style="margin-bottom: 10px; font-size: 16px;">You may also contact our support at <a href="https://wa.me/919996716787">+91-99967-16787</a> anytime for any information related to this enquiry.</p>
                                      
                                      </td>
                                </tr>
                                <tr>
                                   <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                         </b></p>
                                      <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                      <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>
  
                                   </td>
                                </tr>
                             </table>
                          </td>
                       </tr>
  
                    </table>
                 </td>
              </tr>
              <tr>
                 <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">
  
                    <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                       &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
                 </td>
              </tr>
  
           </tbody>
        </table>
     </div>
  </div>`,
          };
          let info2 = {
            from: '"Propertyease " <noreply@propertyease.in>', // sender address

            //to: "harshgupta.calinfo@gmail.com",
            to: "sbpb136118@gmail.com,dhamija.piyush7@gmail.com", // list of receivers

            subject: `Property Id: ${5000 + parseInt(insertId)} ${req.body.pro_user_email
              } listed new Property`, // Subject line
            html: `<div style="margin:0px;padding:0px;">
     <div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
        <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
           <tbody>
              <tr>
                 <td style="width:700px;display:block;clear:both">
                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">
  
                       <tr style="height:80px; text-align:center;">
                          <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                          </td>
                       </tr>
                 </td>
              </tr>
              <tr>
                 <td>
                    <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">
  
                       <tr>
                          <td>
                             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">
  
                                <tr>
                                   <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom: 10px;"> Dear Admin,</b>
                                      
                                      <p style="margin-bottom: 10px; font-size: 16px;">${req.body.pro_user_email
              } has list following Property, Property Id: ${5000 + parseInt(insertId)
              } .</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">
  Check out your property: 
  <a href="https://propertyease.in/${propertyLink}">${propertyLink}</a>
</p>
                                      <p style="margin-bottom: 10px; font-size: 16px;">You can Contact him/her on <a href="https://wa.me/${"91" + req.body.pro_login_number
              }">+91-${req.body.pro_login_number
              }</a>.</p>
                                      
                                      </td>
                                </tr>
                                <tr>
                                   <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                      <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                         </b></p>
                                      <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                      <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>
  
                                   </td>
                                </tr>
                             </table>
                          </td>
                       </tr>
  
                    </table>
                 </td>
              </tr>
              <tr>
                 <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">
  
                    <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                       &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
                 </td>
              </tr>
  
           </tbody>
        </table>
     </div>
  </div>`,
          };

          transporter.sendMail(info, (err, data) => {
            if (err) return res.status(500).json(err);
            transporter.sendMail(info2, (err, data) => {
              if (err) return res.status(500).json(err);

              if (req.body.is_lifetime_free == 1) {
                if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
                  //console.log("inside 3rd block");
                  //   digesttransporter.sendMail(info3, (err, data) => {
                  //     if (err) return res.status(500).json(err);
                  //     return res.status(200).json(insertId);
                  // });

                  // const emails_list2 = [
                  //   "harshgupta.calinfo@gmail.com",
                  //   "harshgarg1009@gmail.com",
                  // ];
                  sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                  return res.status(200).json(insertId);
                } else {
                  //console.log("3rd block skipped");
                  return res.status(200).json(insertId);
                }
              } else if (req.body.free_listings_remaining > 0) {
                const updated_free_listings_remaining = req.body.free_listings_remaining - 1;
                const updateq =
                  "UPDATE login_module SET free_listings_remaining = ? where login_id = ?";
                db.query(updateq, [updated_free_listings_remaining, req.body.pro_user_id], (err, data) => {
                  if (err) return res.status(500).json(err);
                  if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
                    sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                    return res.status(200).json(insertId);
                  } else {
                    return res.status(200).json(insertId);
                  }
                });
              } else if (req.body.paid_listings_remaining > 0) {
                const updated_paid_listings_remaining = req.body.paid_listings_remaining - 1;
                let updtaed_plan_status = 0;
                if (updated_paid_listings_remaining == 0) {
                  updtaed_plan_status = 2;
                } else {
                  updtaed_plan_status = 1;
                }
                const updateq =
                  "UPDATE login_module SET paid_listings_remaining = ?, plan_status = ? where login_id = ?";

                db.query(updateq, [updated_paid_listings_remaining, updtaed_plan_status, req.body.pro_user_id], (err, data) => {
                  if (err) return res.status(500).json(err);
                  if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
                    sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
                    return res.status(200).json(insertId);
                  } else {
                    return res.status(200).json(insertId);
                  }
                });
              }

              // const updateq =
              //   "UPDATE login_module SET pro_added_recently = pro_added_recently + 1 where user_id = ? order by tran_id desc limit 1";




              // db.query(updateq, [req.body.pro_user_id], (err, data) => {
              //   if (err) return res.status(500).json(err);
              //   // console.log(
              //   //   "process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME : ",
              //   //   process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME,
              //   //   typeof process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME
              //   // );
              //   if (process.env.SEND_NEW_LISTING_EMAIL_EVERYTIME == 1) {
              //     //console.log("inside 3rd block");
              //     //   digesttransporter.sendMail(info3, (err, data) => {
              //     //     if (err) return res.status(500).json(err);
              //     //     return res.status(200).json(insertId);
              //     // });

              //     // const emails_list2 = [
              //     //   "harshgupta.calinfo@gmail.com",
              //     //   "harshgarg1009@gmail.com",
              //     // ];
              //     sendMultipleEmails(emails_list, req.body, insertId, propertyLink, formatted_price);
              //     return res.status(200).json(insertId);
              //   } else {
              //     //console.log("3rd block skipped");
              //     return res.status(200).json(insertId);
              //   }
              // });
              //});
              //return res.status(200).json(insertId);
            });
          });
        });
      });
    });
  });
};


const sendMultipleEmails = (emailsList, body, insertId, propertyLink, formatted_price) => {
  const emailsRes = {};

  for (let i = 0, len = emailsList.length; i < len; i++) {
    const res = sendNewMail({
      from: '"Propertyease " <noreply@propertyease.in>',
      to: emailsList[i],
      //subject: `New Property Listed`,
      subject: `${body.pro_area_size +
        " " +
        body.pro_area_size_unit +
        " " +
        body.pro_type.split(",")[0] +
        " "
        } for ${body.pro_ad_type === "Rent" ? "Rent" : "Sale"} in ${body.pro_locality + ", "} ${body.pro_sub_district ? body.pro_sub_district + ", " : ""} ${body.pro_city + ", "} ${body.pro_state}`,
      body: `
  <div class="wrapper" style="width: 710px;margin: 40px auto;padding: 20px;border-radius: 10px;border: 1px solid #ede3e3;">
  <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
      style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
      <tbody>
          <tr>
              <td align="center" style="padding:0;Margin:0">
                  <table class="es-content-body"
                      style="border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:710px"
                      cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                      <tbody>
                          <tr>
                              <td align="left"
                                  style="Margin:0;padding-left:20px;padding-right:20px;padding-top:30px;padding-bottom:30px">
                                  <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                      style="border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                          <tr>
                                              <td align="left" style="padding:0;Margin:0;width:560px">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                                      style="border-collapse:collapse;border-spacing:0px">
                                                      <tbody>
                                                          <tr>
                                                              <td align="center"
                                                                  style="padding:10px;Margin:0;font-size:0px"><a
                                                                      target="_blank" href="#"
                                                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#69686D;font-size:14px"><img
                                                                          src="https://www.propertyease.in/images/logo.png"
                                                                          alt="Real Estate Welcome"
                                                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                          title="Real Estate Welcome" height="60"></a>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="center"
                                                                  style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                                                  <h1
                                                                      style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;font-size:30px;font-style:normal;font-weight:normal;color:#014751">
                                                                      New listing alert</h1>
                                                                  
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="center" class="es-m-txt-l es-m-p0r es-m-p0l"
                                                                  style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px">
                                                                  <p
                                                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;line-height:21px;color:#69686D;font-size:14px">
                                                                      Dear Valued User,</p>
                                                                  <p
                                                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;line-height:21px;color:#69686D;font-size:14px">
                                                                      <br>
                                                                  </p>
                                                                  <p
                                                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;line-height:21px;color:#69686D;font-size:14px">
                                                                      We are excited to share with you our latest property
                                                                      listing! Please feel free to contact us at <a href="https://wa.me/919996716787">+91-99967-16787</a>. We are here to assist you and provide further information as needed.
                                                                  </p>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </td>
          </tr>
      </tbody>
  </table>
  <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
      style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
      <tbody>
     
          <tr style="padding-top: 15px">
              <td align="center" style="padding:0;Margin:0">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                      role="none"
                      style="border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px">
                      <tbody>
                          <tr>
                              <td align="left" bgcolor="#F7F6F4"
                                  style="padding:20px;Margin:0;background-color:#f7f6f4;border-radius:30px">
                                  <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:270px" valign="top"><![endif]-->
                                  <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                                      style="border-collapse:collapse;border-spacing:0px;float:left">
                                      <tbody>
                                          <tr>
                                              <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:270px">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                                      style="border-collapse:collapse;border-spacing:0px">
                                                      <tbody>
                                                          <tr>
                                                              <td align="center" style="padding:0;Margin:0;font-size:0px">
                                                                  <a target="_blank" href="#"
                                                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#69686D;font-size:14px">
                                                                      <img
                                                                          class="adapt-img p_image"
                                                                          src="https://api.propertyease.in/propertyImages/watermark/default.webp"
                                                                          alt=""
                                                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;border-radius:20px"
                                                                          width="270"></a>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                                  <!--[if mso]></td><td style="width:20px"></td><td style="width:270px" valign="top"><![endif]-->
                                  <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                                      style="border-collapse:collapse;border-spacing:0px;float:right">
                                      <tbody>
  
                                      
                                          <tr>
                                              <td align="left" style="padding:0;Margin:0;width:365px">
                                                  <table cellpadding="0" cellspacing="0" width="100%"
                                                      style="border-collapse:separate;border-spacing:0px;border-radius:30px;background-color:#f7f6f4"
                                                      bgcolor="#F7F6F4" role="presentation">
                                                      <tbody>
                                                          <tr>
                                                              <td align="left"
                                                                  style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px">
                                                                  <a href="https://propertyease.in/${propertyLink}" style="text-decoration: none;">
                                                                  <h3 class="p_price"
                                                                      style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;font-size:20px;font-style:normal;font-weight:normal;color:#014751">
                                                                      <strong>
  
                                      ${body.pro_area_size +
        " " +
        body.pro_area_size_unit +
        " " +
        body.pro_type.split(",")[0] +
        " "
        }
                      for ${body.pro_ad_type === "Rent" ? "Rent" : "Sale"} in
                      <span className="text-capitalize">
                        ${body.pro_locality + ", "}
                      </span>
                      
                      ${body.pro_sub_district
          ? body.pro_sub_district + ", "
          : ""
        }
                      ${body.pro_city + ", "}
                      ${body.pro_state}</strong>
                                                                  </h3>
  </a>
                                                              </td>
                                                          </tr>
  
                                                          <tr>
                                                              <td align="left"
                                                                  style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px">
                                                                  <h3 class="p_price"
                                                                      style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;font-size:20px;font-style:normal;font-weight:normal;color:#014751">
                                                                      <strong> ${body.pro_amt
          ? "₹" +
          formatted_price
          : "Ask Price"
        }</strong>
                                                                  </h3>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td style="padding:0;Margin:0">
                                                                  <table cellpadding="0" cellspacing="0" width="100%"
                                                                      class="es-menu" role="presentation"
                                                                      style="border-collapse:collapse;border-spacing:0px">
                                                                      <tbody>
                                                                          <tr class="links-images-left">
                                                                              <td align="left" valign="top" width="100%"
                                                                                  class="p_description"
                                                                                  style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;padding-right:15px;border:0">
                                                                                  <a target="_blank" href="#"
                                                                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:Montserrat, helvetica, arial, sans-serif;color:#69686D;font-size:14px"><img
                                                                                          src="https://tlr.stripocdn.email/content/guids/CABINET_d4268b164551da89e57ab4ef989bf64a3c37acea80029fd0e3ad24c59f443754/images/group.png"
                                                                                          alt="New property Listed"
                                                                                          title="New property Listed"
                                                                                          align="absmiddle" width="16"
                                                                                          style="display:inline-block !important;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;padding-right:5px;vertical-align:middle">${body.pro_locality
        },&nbsp;
                    ${body.pro_city}</a>
                                                                              </td>
                                                                          </tr>
                                                                      </tbody>
                                                                  </table>
                                                              </td>
                                                          </tr>
  
                                                          <tr>
                                                              <td align="left"
                                                                  style="padding:0;Margin:0;padding-top:10px;padding-bottom:15px"><!--[if mso]><a href="https://propertyease.in/${propertyLink}" target="_blank" hidden>
     <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="#" 
                 style="height:36px; v-text-anchor:middle; width:167px" arcsize="50%" strokecolor="#014751" strokeweight="1px" fillcolor="#f7f6f4">
         <w:anchorlock></w:anchorlock>
         <center style='color:#014751; font-family:Montserrat, helvetica, arial, sans-serif; font-size:12px; font-weight:400; line-height:12px;  mso-text-raise:1px'><a href="https://propertyease.in/${propertyLink}">View Listing</a></center>
     </v:roundrect></a>
  <![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border"
                                                                      style="border-style:solid;border-color:#014751;background:#f7f6f4;border-width:1px;display:inline-block;border-radius:30px;width:auto;mso-hide:all"><a
                                                                          href="https://propertyease.in/${propertyLink}" class="es-button" target="_blank"
                                                                          style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#014751;font-size:14px;display:inline-block;background:#f7f6f4;border-radius:30px;font-family:Montserrat, helvetica, arial, sans-serif;font-weight:normal;font-style:normal;line-height:17px;width:auto;text-align:center;padding:10px 40px 10px 40px;mso-padding-alt:0;mso-border-alt:10px solid  #f7f6f4">View
                                                                          Listing</a></span><!--<![endif]--></td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table><!--[if mso]></td></tr></table><![endif]-->
                              </td>
                          </tr>
                          
                      </tbody>
                  </table>
              </td>
          </tr>
          <tr>
                              <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                                  <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                      style="border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                          <tr>
                                              <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                                      style="border-collapse:collapse;border-spacing:0px">
                                                      <tbody>
                                                          <tr>
                                                              <td align="center" height="25" style="padding:0;Margin:0">
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
          
      </tbody>
  </table>
  
  
  
  <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none"
      style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:#DADFE2;background-repeat:repeat;background-position:center top">
      <tbody>
          <tr>
              <td align="center" style="padding:0;Margin:0">
                  <table bgcolor="#ffffff" class="es-footer-body" align="center" cellpadding="0" cellspacing="0"
                      role="none"
                      style="border-collapse:collapse;border-spacing:0px;background-color:#DADFE2;width:710px">
                      <tbody>
                          <tr>
                              <td align="left"
                                  style="padding:0;Margin:0;padding-top:20px;padding-left:20px;     padding-bottom: 18px; padding-right:20px"><!--[if mso]><table style="width:560px" cellpadding="0" 
                         cellspacing="0"><tr><td style="width:295px" valign="top"><![endif]-->
                                  <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                                      style="border-collapse:collapse;border-spacing:0px;float:left">
                                      <tbody>
                                          <tr>
                                              <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:295px">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                                      style="border-collapse:collapse;border-spacing:0px">
                                                      <tbody>
                                                          <tr>
                                                              <td align="left" class="es-m-txt-l"
                                                                  style="padding:0;Margin:0;font-size:0px"><a
                                                                      target="_blank" href="https://propertyease.in/"
                                                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#69686D;font-size:12px"><img
                                                                          src="https://www.propertyease.in/images/logo.png"
                                                                          alt="Logo"
                                                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                          height="35" title="Logo"></a></td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left"
                                                                  style="padding:0;Margin:0;padding-top:15px">
                                                                  <p
                                                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;line-height:18px;color:#69686D;font-size:12px">
                                                                      Provides clients with quality real estate services.
                                                                      We help you to find your perfect home.</p>
                                                              </td>
                                                          </tr>
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                                  <!--[if mso]></td><td style="width:20px"></td><td style="width:245px" valign="top"><![endif]-->
                                  <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                                      style="border-collapse:collapse;border-spacing:0px;float:right">
                                      <tbody>
                                          <tr>
                                              <td align="left" style="padding:0;Margin:0;width:245px">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                                      style="border-collapse:collapse;border-spacing:0px">
                                                      <tbody>
                                                          <tr>
                                                              <td align="right" class="es-m-txt-l"
                                                                  style="padding:0;Margin:0">
                                                                  <p
                                                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Montserrat, helvetica, arial, sans-serif;line-height:18px;color:#69686D;font-size:12px">
                                                                      <a href="https://propertyease.in/" target="_blank"
                                                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#69686D;font-size:12px">Home
                                                                          </a><br>
                                                                          <a
                                                                          href="https://propertyease.in/contactus" target="_blank"
                                                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#69686D;font-size:12px">Contact
                                                                          us</a><br><a href="https://propertyease.in/allproperties" target="_blank"
                                                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#69686D;font-size:12px">View Properties</a>
                                                                  </p>
                                                              </td>
                                                          </tr>
                                                          
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table><!--[if mso]></td></tr></table><![endif]-->
                              </td>
                          </tr>
  
  
  
                      </tbody>
                  </table>
              </td>
          </tr>
      </tbody>
  </table>
  
  </div>
  `,
    });
    emailsRes[emailsList[i]] = res;
  }
  return emailsRes;
};

const sendNewMail = (data) => {
  const { from, to, subject, body } = data;
  try {
    transporter.sendMail({
      from,
      to,
      subject: subject || "no subject",
      html: body,
    });
    //return { success: true, message: "Email sent successfully!" };
    console.log("mail sent : ", to);
  } catch (error) {
    console.error(error);
    console.log("failed : ", to);
    //return { success: false, message: "Email not sent !" };
  }
};

export const updateProperty = (req, res) => {



  const sanitize = (input) => input.toLowerCase().replace(/[\s.,]+/g, "-");
  const areaSize = sanitize(req.body.pro_area_size);
  const areaSizeUnit = sanitize(req.body.pro_area_size_unit);
  const propertyType = req.body.pro_type
    ? sanitize(req.body.pro_type.split(",")[0])
    : "";
  const adType = req.body.pro_ad_type === "Rent" ? "rent" : "sale";
  const locality = sanitize(req.body.pro_locality);
  const city = req.body.pro_city
    ? sanitize(req.body.pro_city)
    : sanitize(req.body.pro_state.replaceAll("(", "").replaceAll(")", ""));

  // const propertyLink = `${areaSize}-${areaSizeUnit}-${propertyType}-for-${adType}-in-${locality}-${city}-${req.body.pro_id}`;

  const url =
    areaSize +
    "-" +
    areaSizeUnit +
    "-" +
    propertyType +
    "-for-" +
    adType +
    "-in-" +
    locality +
    "-" +
    city + "-" +
    req.body.pro_id;

  const url2 =
    req.body.pro_area_size +
    "-" +
    req.body.pro_area_size_unit
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll(".", "") +
    "-" +
    (req.body.pro_type
      ? req.body.pro_type.split(",")[0].toLowerCase().replaceAll(" ", "-")
      : "") +
    "-for-" +
    (req.body.pro_ad_type === "Rent" ? "rent" : "sale") +
    "-in-" +
    req.body.pro_locality.trim().toLowerCase().replaceAll(" ", "-") +
    "-" +
    (req.body.pro_city
      ? req.body.pro_city.toLowerCase().replaceAll(" ", "-") + "-"
      : "") +
    req.body.pro_id;
  const q =
    "UPDATE property_module SET pro_user_type = ?, pro_ad_type = ?, pro_type  = ?, pro_city = ?, pro_locality = ?, pro_plot_no = ?, pro_street = ?, pro_age = ?, pro_floor = ?, pro_bedroom = ?, pro_washrooms = ?, pro_balcony = ?, pro_parking = ?, pro_facing = ?, pro_area_size = ?, pro_width = ?, pro_length = ?, pro_facing_road_width = ?, pro_open_sides = ?, pro_furnishing = ?, pro_ownership_type = ?, pro_approval = ?, pro_amt = ?, pro_rental_status = ?, pro_desc = ?, pro_possession = ?, pro_area_size_unit = ? , pro_facing_road_unit = ? , pro_amt_unit = ?, pro_pincode = ? , pro_negotiable = ? , pro_state = ? , pro_sub_district = ?, pro_other_rooms = ?, pro_near_by_facilities = ?, pro_corner = ?, pro_url = ? WHERE pro_id = ?";
  const values = [
    req.body.pro_user_type,
    req.body.pro_ad_type,
    req.body.pro_type,
    req.body.pro_city,
    req.body.pro_locality,

    req.body.pro_plot_no,
    req.body.pro_street,
    req.body.pro_age,
    req.body.pro_floor,
    req.body.pro_bedroom,
    req.body.pro_washrooms,

    req.body.pro_balcony,
    req.body.pro_parking,
    req.body.pro_facing,
    req.body.pro_area_size,
    req.body.pro_width,

    req.body.pro_length,
    req.body.pro_facing_road_width,
    req.body.pro_open_sides,
    req.body.pro_furnishing,
    req.body.pro_ownership_type,

    req.body.pro_approval,
    req.body.pro_amt,
    req.body.pro_rental_status,
    req.body.pro_desc,
    req.body.pro_possession,

    req.body.pro_area_size_unit,
    req.body.pro_facing_road_unit,
    req.body.pro_amt_unit,
    req.body.pro_pincode,
    req.body.pro_negotiable,

    req.body.pro_state,
    req.body.pro_sub_district,
    req.body.pro_other_rooms,
    req.body.pro_near_by_facilities,
    req.body.pro_corner,
    url,
    req.body.pro_id,

  ];
  db.query(q, values, (err, data) => {
    console.log("values : ", values);
    if (err) return res.status(500).json(err);

    return res.status(200).json("Updated Successfully");
  });
};

export const addOrigin = (req, res) => {
  console.log("req.body : ", req.body);
  const q = "INSERT INTO user_origin_module (origin_url) Values (?)";
  const values = [req.body];
  db.query(q, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    req.headers.referer = "https://propertyease.in/";
    const insertId = data.insertId;
    console.log(insertId);
    return res.status(200).json(insertId);
  });
};

// export const fetchPropertyData = (req, res) => {
//   // res.setHeader('Set-Cookie', `token=sdf; HttpOnly`);
//   // console.log("fg")
//   // const refreshToken = req.cookies.jwt;
//   // console.log("refreshToken : " , refreshToken);
//   const q =
//     "SELECT DISTINCT property_module_images.* , property_module.* FROM property_module left join property_module_images on property_module.pro_id = property_module_images.img_cnct_id where pro_listed = 1 group by pro_id ORDER BY pro_id DESC";
//   db.query(q, (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).json(data);
//   });
// };

// myObject.intents.push({
//   tag: "listing",
//   patterns: ["property 1 , property 1"],
//   responses: ["newresponse"],
//   context: [""],
// });

// fs.appendFile("test.json", jsonData, 'utf8', (err) => {
//   if (err) {
//       console.error("Error writing to file:", err);
//   } else {
//       console.log("Data has been written to test.json");
//   }
// });

export const fetchPropertyData = (req, res) => {
  const q = `SELECT DISTINCT property_module_images.* , property_module.* , agent_data.agent_type as user_type, agent_data.agent_name , agent_data.agent_sub_district, agent_data.agent_city, agent_data.agent_state FROM property_module left join property_module_images on 
    property_module.pro_id = property_module_images.img_cnct_id left join (SELECT agent_type,user_cnct_id,agent_name ,agent_sub_district, agent_city, agent_state FROM agent_module) as agent_data on 
    property_module.pro_user_id = agent_data.user_cnct_id where pro_listed = 1 group by pro_id ORDER BY pro_id DESC`;
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    // const updatedJsonData = JSON.stringify(myObject, null, 4);
    // fs.writeFileSync("test.json", updatedJsonData, "utf8");
    // console.log("Data has been appended to test.json");
    return res.status(200).json(data);
  });
};





// export const fetchPropertyData = (req, res) => {

//   const filePath = path.resolve(process.cwd(), './build', 'index.html');

//   // Read index.html file asynchronously
//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading index.html:', err);
//       return res.status(500).send('Error reading index.html');
//     }

//     // Replace placeholders with dynamic content
//     data = data.replace(/__TITLE__/g, 'Home Page')
//                .replace(/__DESCRIPTION__/g, 'Home page description.');

//     // Perform database query to fetch data
//     const query = `SELECT DISTINCT property_module_images.*, property_module.*, agent_data.agent_type AS user_type, agent_data.agent_name
//                    FROM property_module
//                    LEFT JOIN property_module_images ON property_module.pro_id = property_module_images.img_cnct_id
//                    LEFT JOIN (SELECT agent_type, user_cnct_id, agent_name FROM agent_module) AS agent_data ON property_module.pro_user_id = agent_data.user_cnct_id
//                    WHERE pro_listed = 1
//                    GROUP BY pro_id
//                    ORDER BY pro_id DESC`;

//     db.query(query, (err, dbData) => {
//       if (err) {
//         console.error('Error executing database query:', err);
//         return res.status(500).json({ error: 'Database error' });
//       }

//       // Here, you can manipulate dbData as needed before sending it as a response
//       // For example, you may want to process or format the data before sending it

//       // Send the modified index.html or other response as needed
//       // Example:
//       res.status(200).send(dbData);
//       //res.status(200).json(dbData); // Sending JSON response for demonstration
//     });
//   });
// };

export const fetchPropertyDataById = (req, res) => {
  const q = "SELECT * from property_module where pro_id = ? ";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const checkPropertyExists = (req, res) => {
  const q =
    "SELECT count(*) as pro_count FROM property_module where pro_id = ? ";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchLatestProperty = (req, res) => {
  const q =
    "SELECT DISTINCT property_module_images.img_cnct_id , property_module.* , property_module_images.img_link FROM property_module left join property_module_images on property_module.pro_id = property_module_images.img_cnct_id where pro_listed = 1 group by pro_id ORDER BY pro_id DESC LIMIT 6";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchLatestProperty1 = (req, res) => {
  const q =
    "SELECT DISTINCT property_module_images.img_cnct_id , property_module.* , property_module_images.img_link FROM property_module left join property_module_images on property_module.pro_id = property_module_images.img_cnct_id where pro_listed = 1 group by pro_id ORDER BY pro_id DESC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchPropertyDataByCity = (req, res) => {
  const q =
    "SELECT DISTINCT property_module_images.* , property_module.* FROM property_module left join property_module_images on property_module.pro_id = property_module_images.img_cnct_id group by pro_id where pro_city = ? and pro_listed = 1 ORDER BY pro_id DESC";
  db.query(q, [req.params.city], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchLatestPropertyByCity = (req, res) => {
  const q =
    "SELECT DISTINCT property_module_images.img_cnct_id , property_module.* , property_module_images.img_link FROM property_module left join property_module_images on property_module.pro_id = property_module_images.img_cnct_id where pro_city = ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC LIMIT 2";
  db.query(q, [req.params.city], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

// export const fetchPropertyDataByCat = (req, res) => {
//   const para = "%" + req.params.proType + "%";
//   const q =
//     "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC ";
//   db.query(q, [para], (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).json(data);
//   });
// };

export const fetchPropertyDataByCat = (req, res) => {
  const para = "%" + req.params.proType + "%";
  const q = `SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link, agent_data.agent_type as user_type, agent_data.agent_name, agent_data.agent_sub_district, agent_data.agent_city, agent_data.agent_state  FROM 
    property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id 
    left join (SELECT agent_type,user_cnct_id,agent_name, agent_sub_district, agent_city, agent_state FROM agent_module) as agent_data on property_module.
    pro_user_id = agent_data.user_cnct_id WHERE pro_type like ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC; `;
  db.query(q, [para], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

// export const fetchPropertyDataByCatAndCity = (req, res) => {
//   console.log("req.params : " , req.params);
//   const para = "%" + req.params.proType + "%";
//   const q =
//     "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? and pro_city = ? and pro_ad_type = ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC ";
//   db.query(q, [para, req.params.proCity, req.params.proAd], (err, data) => {
//     if (err) return res.status(500).json(err);

//     return res.status(200).json(data);
//   });
// };

export const fetchPropertyDataByCatAndCity = (req, res) => {
  console.log("req.params : ", req.params);
  const para = "%" + req.params.proType + "%";
  const q =
    "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? and pro_ad_type = ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC ";
  db.query(q, [para, req.params.proAd], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};

export const moreProperties = (req, res) => {
  console.log("req.params", req.params.proAd);
  const q = `SELECT property_module.*, agent_data.agent_type as user_type, agent_data.agent_name,agent_data.agent_sub_district, agent_data.agent_city, agent_data.agent_state FROM property_module left join 
    (SELECT agent_type,user_cnct_id,agent_name, agent_sub_district, agent_city, agent_state FROM agent_module) as agent_data on property_module.pro_user_id = 
    agent_data.user_cnct_id where pro_ad_type = "Rent" and pro_listed = 1 order by pro_id desc limit 5;`;
  db.query(q, [req.params.proAd], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchLatestPropertyByCat = (req, res) => {
  const para = "%" + req.params.proType + "%";
  const q =
    "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC LIMIT 3 ";
  db.query(q, [para], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchPropertySubCatNo = (req, res) => {
  const q =
    "SELECT count(pro_type) as pro_sub_cat_number , pro_type FROM property_module where pro_listed = 1 group by pro_type";
  db.query(q, [req.params.proType], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchPropertyDataBySubCat = (req, res) => {
  const q =
    "SELECT * FROM property_module where pro_sub_cat = ? and pro_listed = 1";
  db.query(q, [req.params.proSubType], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchPropertyDataByUserId = (req, res) => {
  const q =
    "SELECT * FROM property_module where pro_user_id = ? and pro_listed = 1 ORDER BY pro_id DESC";
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

// export const fetchPropertyDataByUserId1 = (req, res) => {
//   //await verifyJwt(req,res);
//   const q =
//     "SELECT * FROM property_module where pro_user_id = ? ORDER BY pro_id DESC";
//   db.query(q, [req.params.userId], (err, data) => {
//     if (err) return res.status(500).json(err);

//     return res.status(200).json(data);
//   });
// };

// export const fetchPropertyDataByUserId1 = (req, res) => {
//   //await verifyJwt(req,res);
//   const q = `
//     SELECT 
//     property_module.*, 
//     COUNT(property_interest.interest_property_id) AS pro_responses ,
//     COALESCE(property_module.pro_views, 0) AS pro_views1 
// FROM 
//     property_module
// LEFT JOIN 
//     property_interest 
// ON 
//     property_module.pro_id = property_interest.interest_property_id
// WHERE 
//     property_module.pro_user_id = ?
// GROUP BY 
//     property_module.pro_id
// ORDER BY 
//     property_module.pro_id DESC;
//     `;
//   db.query(q, [req.params.userId], (err, data) => {
//     if (err) return res.status(500).json(err);

//     return res.status(200).json(data);
//   });
// };



export const fetchPropertyDataByUserId1 = (req, res) => {
  //await verifyJwt(req,res);
  const q = `
    SELECT *
FROM 
    property_module

ORDER BY 
    property_module.pro_id DESC;
    `;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};



export const fetchExpiredPropertyData = (req, res) => {
  const q = `SELECT 
    property_module.*, 
    COUNT(property_interest.interest_property_id) AS pro_responses ,
    COALESCE(property_module.pro_views, 0) AS pro_views1 
FROM 
    property_module
LEFT JOIN 
    property_interest 
ON 
    property_module.pro_id = property_interest.interest_property_id
WHERE 
    property_module.pro_user_id = ? and pro_listed = 0 and DATEDIFF(pro_renew_date, DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))) < 1
GROUP BY 
    property_module.pro_id
ORDER BY 
    property_module.pro_id DESC;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    // const updatedJsonData = JSON.stringify(myObject, null, 4);
    // fs.writeFileSync("test.json", updatedJsonData, "utf8");
    // console.log("Data has been appended to test.json");
    return res.status(200).json(data);
  });
};


export const fetchListedPropertyDataById = (req, res) => {
  const q = `SELECT 
    property_module.*, 
    COUNT(property_interest.interest_property_id) AS pro_responses ,
    COALESCE(property_module.pro_views, 0) AS pro_views1 
FROM 
    property_module
LEFT JOIN 
    property_interest 
ON 
    property_module.pro_id = property_interest.interest_property_id
WHERE 
    property_module.pro_user_id = ? and pro_listed = 1 and pro_sale_status = 0 
GROUP BY 
    property_module.pro_id
ORDER BY 
    property_module.pro_id DESC;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    // const updatedJsonData = JSON.stringify(myObject, null, 4);
    // fs.writeFileSync("test.json", updatedJsonData, "utf8");
    // console.log("Data has been appended to test.json");
    return res.status(200).json(data);
  });
};

export const getPropertyById = (req, res) => {
  const q = `SELECT * FROM property_module WHERE pro_id = ?`;
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};


// export const fetchDeListedPropertyDataById = (req, res) => {
//   const q = `SELECT 
//     property_module.*, 
//     COUNT(property_interest.interest_property_id) AS pro_responses ,
//     COALESCE(property_module.pro_views, 0) AS pro_views1 
// FROM 
//     property_module
// LEFT JOIN 
//     property_interest 
// ON 
//     property_module.pro_id = property_interest.interest_property_id
// WHERE 
//     property_module.pro_user_id = ? and pro_listed = 0 and pro_sale_status = 0 and DATEDIFF(pro_renew_date, DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))) > 0
// GROUP BY 
//     property_module.pro_id
// ORDER BY 
//     property_module.pro_id DESC;`;
//   db.query(q, [req.params.userId], (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).json(data);
//   });
// };


export const fetchDeListedPropertyDataById = (req, res) => {
  const q = `SELECT 
    property_module.*, 
    COUNT(property_interest.interest_property_id) AS pro_responses ,
    COALESCE(property_module.pro_views, 0) AS pro_views1 
FROM 
    property_module
LEFT JOIN 
    property_interest 
ON 
    property_module.pro_id = property_interest.interest_property_id
WHERE 
    property_module.pro_user_id = ? and pro_listed = 0 and pro_sale_status = 0
GROUP BY 
    property_module.pro_id
ORDER BY 
    property_module.pro_id DESC;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};



export const fetchSoldOutPropertyDataById = (req, res) => {
  const q = `SELECT 
    property_module.*, 
    COUNT(property_interest.interest_property_id) AS pro_responses ,
    COALESCE(property_module.pro_views, 0) AS pro_views1 
FROM 
    property_module
LEFT JOIN 
    property_interest 
ON 
    property_module.pro_id = property_interest.interest_property_id
WHERE 
    property_module.pro_user_id = ? and pro_listed = 0 and pro_sale_status = 1
GROUP BY 
    property_module.pro_id
ORDER BY 
    property_module.pro_id DESC;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    // const updatedJsonData = JSON.stringify(myObject, null, 4);
    // fs.writeFileSync("test.json", updatedJsonData, "utf8");
    // console.log("Data has been appended to test.json");
    return res.status(200).json(data);
  });
};




// export const fetchViews = (req, res) => {
//   //await verifyJwt(req,res);
//   const q =
//     "SELECT sum(pro_views) as pro_views FROM property_module where pro_user_id = ?";
//   db.query(q, [req.params.userId], (err, data) => {
//     if (err) return res.status(500).json(err);

//     return res.status(200).json(data);
//   });
// };

export const fetchRespondentByUser = (req, res) => {
  const q = `SELECT 
    property_module.*,
    property_module.pro_id,
    property_module.pro_ad_type,
    property_module.pro_amt,
	  property_module.pro_amt_unit,
    property_module.pro_sale_status,
    property_module.pro_listed,
    property_module.pro_creation_date,
    count(property_interest.interest_property_id) AS pro_responses,
    property_interest.interest_property_id AS pro_response_id ,
    property_interest.interest_person_id,
    COALESCE(property_module.pro_views, 0) AS pro_views, 
    property_interest.interested_name,
    property_interest.interested_email,
    property_interest.interested_phone
FROM 
    property_module
right JOIN 
    property_interest 
ON 
    property_module.pro_id = property_interest.interest_property_id
    

WHERE 
    property_module.pro_user_id = ?
GROUP BY 
    property_module.pro_id
ORDER BY 
    property_module.pro_id DESC;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};

export const fetchRespondentByPro = (req, res) => {
  //await verifyJwt(req,res);
  const q = `SELECT * FROM u747016719_propertyease.property_interest where interest_property_id = ?`;
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};

// export const fetchResponses = (req, res) => {
//   //await verifyJwt(req,res);
//   const q =
//     "SELECT count(property_interest.interest_property_id) as pro_responses FROM property_interest left join property_module on property_module.pro_id = property_interest.interest_property_id  where property_module.pro_user_id = ?";
//   db.query(q, [req.params.userId], (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).json(data);
//   });
// };

export const fetchResponsesByProId = (req, res) => {
  //await verifyJwt(req,res);
  const q =
    "SELECT count(interest_property_id) as interest_property_id  FROM u747016719_propertyease.property_interest where interest_property_id = ? group by interest_person_id";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchLast30DaysListings = (req, res) => {
  //await verifyJwt(req,res);
  const q = `SELECT 
  pro_count.pro_count, 
  pro_count.pro_creation_date, 
  DATEDIFF(CONVERT_TZ(pro_count.pro_creation_date, '+00:00', '+05:30'), CONVERT_TZ(NOW(), '+00:00', '+05:30')) AS Days, 
  COALESCE(list_plan_transactions.pro_plan_added_slots, 0) AS pro_plan_added_slots,
  COALESCE(list_plan_transactions.plan_status, 0) AS plan_status,
  COALESCE(list_plan_transactions.list_plan_starts_on, 0) AS list_plan_starts_on,
  COALESCE(list_plan_transactions.tran_id, 0) AS tran_id
FROM 
  login_module AS login 

LEFT JOIN 
  property_module ON login.login_id = property_module.pro_user_id
LEFT JOIN 
  (SELECT 
     pro_user_id,
     COUNT(pro_id) AS count_of_properties 
   FROM 
     property_module 
   GROUP BY 
     pro_user_id
  ) AS property_count ON login.login_id = property_count.pro_user_id 
LEFT JOIN 
  (SELECT 
     pro_user_id,
     COUNT(pro_id) AS pro_count, 
     pro_creation_date
   FROM 
     property_module 
   WHERE 
     DATEDIFF(pro_creation_date, CONVERT_TZ(NOW(), '+00:00', '+05:30')) > -30 
   GROUP BY 
     pro_user_id
  ) AS pro_count ON login.login_id = pro_count.pro_user_id
LEFT JOIN 
  list_plan_transactions ON list_plan_transactions.user_id = login.login_id
                         AND (list_plan_transactions.plan_status = 1 OR list_plan_transactions.plan_status = 2 ) where login.login_id = ? group by login.login_id 
ORDER BY 
  login.login_id DESC;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};

export const fetchShortListProperty = (req, res) => {
  const q = `SELECT shortlist_module.*, 
       property_module.*
FROM shortlist_module
LEFT JOIN property_module
ON shortlist_module.shortlist_pro_id = property_module.pro_id
WHERE shortlist_cnct_id = ?
  AND property_module.pro_id IS NOT NULL;`;
  db.query(q, [req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const deleteShortlist = (req, res) => {
  const q = "DELETE FROM shortlist_module WHERE shortlist_id = ?";
  db.query(q, [req.params.shortlistId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Deleted Successfully");
  });
};

export const deleteProperty = (req, res) => {
  const q =
    "DELETE property_module.* ,property_module_images.* from property_module RIGHT JOIN property_images_module on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_id = ?";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Deleted Successfully");
  });
};

export const fetchImagesWithId = (req, res) => {
  const q = "SELECT * from property_module_images WHERE img_cnct_id = ?";
  db.query(q, [req.params.imgId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const shortlistProperty = (req, res) => {
  const q =
    "SELECT * from shortlist_module WHERE shortlist_pro_id = ? AND shortlist_cnct_id = ?";
  db.query(q, [req.body.propertyId, req.body.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length > 0) return res.status(409).json("Already Shortlisted");
    const q =
      "INSERT into shortlist_module (`shortlist_pro_id` , `shortlist_cnct_id`) VALUES (?)";
    const values = [req.body.propertyId, req.body.userId];
    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("INSERTED SUCCESSFULLY");
    });
  });
};
export const deletePropertyImages = (req, res) => {
  const q = "delete from property_module_images where img_cnct_id = ?";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Deleted Successfully");
  });
};
export const checkShortlist = (req, res) => {
  const q =
    "SELECT * from shortlist_module WHERE shortlist_pro_id = ? AND shortlist_cnct_id = ?";
  db.query(q, [req.body.proId, req.body.cnctId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length > 0) return res.status(200).json("Done");
    return res.status(404).json("not shortlisted");
  });
};
export const checkInterested = (req, res) => {
  const q =
    "SELECT * from property_interest WHERE interest_property_id = ? AND interest_person_id = ?";
  db.query(q, [req.body.proId, req.body.cnctId], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length > 0) return res.status(200).json("Done");
    return res.status(404).json("Not interested");
  });
};
export const fetchCityNo = (req, res) => {
  const q =
    "SELECT count(pro_city) as pro_city_number , pro_city FROM property_module where pro_listed = 1 group by pro_city";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};
export const rentalPropertyTotal = (req, res) => {
  const q =
    "SELECT count(pro_type) as pro_sub_cat_number , pro_type FROM property_module WHERE pro_ad_type = 'Rent' and pro_listed = 1 group by pro_type";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const salePropertyTotal = (req, res) => {
  const q =
    "SELECT count(pro_type) as pro_sub_cat_number , pro_type FROM property_module WHERE pro_ad_type = 'Sale' and pro_listed = 1 group by pro_type;";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const rentalProperty = (req, res) => {
  const para = "%" + req.params.proType + "%";
  const q =
    "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? AND pro_ad_type = 'Rent' and pro_listed = 1 group by pro_id ORDER BY pro_id DESC ";
  db.query(q, [para], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const SubDistrictData = (req, res) => {
  const q =
    "SELECT district,sub_district FROM sub_district_table ORDER BY sub_district ASC ";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const StateCityData = (req, res) => {
  const q =
    "SELECT distinct district , state FROM sub_district_table ORDER BY district ASC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const SubDistrictDataByCity = (req, res) => {
  const city = req.params.city;
  console.log("city : ", city);
  const q =
    "SELECT district,sub_district FROM sub_district_table where district = ? ORDER BY sub_district ASC ";
  db.query(q, [city], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};

export const StateDistinctCityData = (req, res) => {
  const q =
    "SELECT distinct district FROM sub_district_table ORDER BY district ASC";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const fetchSuggestions = (req, res) => {
  const para = req.params.searchValue + "%";
  console.log("para : ", para);
  const q =
    "select distinct * from sub_district_table WHERE district LIKE ? ORDER BY RAND() LIMIT 10; ";
  db.query(q, [para], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data);
  });
};

export const fetchLatestPropertyByCat1 = (req, res) => {
  const para = "%" + req.params.proType + "%";
  const q =
    "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC LIMIT 3 ";
  db.query(q, [para], (err, data) => {
    if (err) return res.status(500).json(err);
    console.log("data : ", data);
    return res.status(200).json(data);
  });
};

// export const fetchPropertyDataById1 = (req, res) => {
//   const q = "SELECT * from property_module where pro_id = ? ";
//   db.query(q, [req.params.proId], (err, data) => {
//     if (err) return res.status(500).json(err);
//     console.log("data1 : " , data )
//     //const para = "%" + req.params.proType + "%";
//     const para = data[0].pro_type.split(",")[1]
//     const q =
//       "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? group by pro_id ORDER BY pro_id DESC LIMIT 3 ";
//     db.query(q, para, (err, data1) => {
//       if (err) return res.status(500).json(err);
//       console.log("data : " , data1)
//     //   return res.status(200).json(data);
//     console.log("data1 : " , data, data1 )
//     return res.status(200).json({data, data1 });
//   });
//   });
// };

export const fetchPropertyDataById1 = (req, res) => {
  const q = "SELECT * from property_module where pro_id = ? ";
  db.query(q, [req.params.proId], (err, data) => {
    if (err) return res.status(500).json(err);
    console.log("data : ", data);
    if (data.length > 0) {
      const para = "%" + data[0].pro_type.split(",")[1] + "%";
      const secondQ =
        "SELECT DISTINCT property_module.*,property_module_images.img_cnct_id  , property_module_images.img_link FROM property_module LEFT join property_module_images on property_module.pro_id = property_module_images.img_cnct_id WHERE pro_type like ? and pro_listed = 1 group by pro_id ORDER BY pro_id DESC LIMIT 6 ";
      db.query(secondQ, [para], (err, data1) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json({ data, data1 });
      });
    } else {
      //return res.status(200).json({ data, data1 });
      const q =
        "SELECT DISTINCT property_module_images.img_cnct_id , property_module.* , property_module_images.img_link FROM property_module left join property_module_images on property_module.pro_id = property_module_images.img_cnct_id where pro_listed = 1 group by pro_id ORDER BY pro_id DESC LIMIT 6";
      db.query(q, (err, data1) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json({ data, data1 });
      });
    }
  });
};

export const updateViews = (req, res) => {
  const q = "UPDATE property_module SET pro_views = ? WHERE pro_id = ?";
  const values = [req.body.pro_views, req.body.pro_id];
  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Updated Successfully");
  });
};

export const updateContacted = (req, res) => {
  const q = "UPDATE property_module SET pro_contacted = ? WHERE pro_id = ?";
  const values = [req.body.pro_contacted, req.body.pro_id];
  db.query(q, values, (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    return res.status(200).json("Updated Successfully");
  });
};

export const updateProListingStatus = (req, res) => {
  const q = "UPDATE property_module SET pro_listed = ? WHERE pro_id = ?";
  const values = [req.body.pro_listed, req.body.pro_id];
  db.query(q, values, (err, data) => {
    console.log(values);
    if (err) return res.status(500).json(err);
    return res.status(200).json("Updated Successfully");
  });
};

export const extendPropertyRenewDate = (req, res) => {
  const q1 = "SELECT no_days FROM auroRemoveProperty";

  let info = {
    from: '"Propertyease " <noreply@propertyease.in>',
    //to: "harshgupta.calinfo@gmail.com",
    to: req.body.login_email,
    //to: "sbpb136118@gmail.com,dhamija.piyush7@gmail.com",
    //to: req.body.pro_user_email,
    subject: `Your Property Listing Has Been Successfully Renewed!`,
    html: `<div style="margin:0px;padding:0px;">
<div style="margin:0px;padding:0px;  margin: 30px auto; width: 700px; padding: 10px 10px;  background-color: #f6f8fc; box-shadow:rgba(13, 109, 253, 0.25) 0px 25px 50px -10px !important; ">
   <table cellpadding="0" style="width:700px;margin:auto;display:block;font-family:\'trebuchet ms\',geneva,sans-serif;">
      <tbody>
         <tr>
            <td style="width:700px;display:block;clear:both">
               <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style=" margin-top:30px;background-clip:padding-box;border-collapse:collapse;border-radius:5px;">

                  <tr style="height:80px; text-align:center;">
                     <td style="padding-left:22px; padding-bottom: 10px"><img src="https://property-five.vercel.app/images/logo.png">
                     </td>
                  </tr>
            </td>
         </tr>
         <tr>
            <td>
               <table style="width:500px;clear:both" border="0" align="center" cellpadding="0" cellspacing="0">

                  <tr>
                     <td>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 0px 0px 0px;">

                           <tr>
                              <td height="10px" style="font-size: 16px;line-height: 24px;letter-spacing:.3px;">
                                 <p style="color:#404040; margin-bottom: 10px;"> Dear User,</b>
                                 <p style="margin-bottom: 10px; font-size: 16px;">We're happy to inform you that your property listing has been successfully renewed! Your property is now active and visible on our platform again, allowing potential buyers or renters to view and inquire about it.</b></p>
                                 <a href='https://www.propertyease.in/${req.body.pro_url
      }' style="margin-bottom: 10px; font-size: 16px;">${req.body.pro_url
      }</a>
    <p style="margin-bottom: 10px; font-size: 16px;">You can continue to manage and update your listing through your dashboard. If you have any questions or need further assistance, our support team is always here to help.</b></p>
                                 <p style="margin-bottom: 10px; font-size: 16px;">You may also contact our support at <a href="https://wa.me/919996716787">+91-99967-16787</a> anytime for any information related to this enquiry.</p>
                              </td>
                           </tr>
                           <tr>
                              <td height="10px" style="font-size: 15px;line-height: 24px;letter-spacing:.3px;">
                                 <p style="color:#404040; margin-bottom:0px;"> <b>Thanks & Regards,
                                    </b></p>
                                 <p style="margin-bottom:0px; font-size: 15px;">Admin Team</p>
                                 <p style="margin-bottom: 10px; font-size: 15px;">Propertyease.in</p>

                              </td>
                           </tr>
                        </table>
                     </td>
                  </tr>

               </table>
            </td>
         </tr>
         <tr>
            <td style="font-size: 14px;text-align: center;line-height: 21px;letter-spacing: .3px; color: #155298; height: 68px;">

               <p style="line-height:22px;margin-bottom:0px;padding: 10px;  color:#000;font-size: 12px;">
                  &copy; Copyright ${new Date().getFullYear()} All Rights Reserved.</p>
            </td>
         </tr>

      </tbody>
   </table>
</div>
</div>`,
  };

  db.query(q1, (err, renewData) => {
    if (err) return res.status(500).json(err);
    const today = new Date();
    const proRenewDate = new Date(req.body.pro_renew_date);
    if (proRenewDate < today) {

      const q = "UPDATE property_module SET pro_listed = 1, pro_renew_date = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE pro_id = ?";
      const values = [renewData[0].no_days, req.body.pro_id];

      db.query(q, values, (err, data) => {
        // console.log("renewData : " , renewData);
        if (err) return res.status(500).json(err);
        //return res.status(200).json("Updated Successfully");
        transporter.sendMail(info, (err, data) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("mail sent");
        });
      });


      // console.log("if block");
      // console.log("proRenewDate < today : ", proRenewDate < today);
      // console.log(proRenewDate , today);
    } else {
      const q = "UPDATE property_module SET pro_listed = 1, pro_renew_date = DATE_ADD(?, INTERVAL ? DAY) WHERE pro_id = ?";
      const values = [req.body.pro_renew_date, renewData[0].no_days, req.body.pro_id];

      db.query(q, values, (err, data) => {
        // console.log("renewData : " , renewData);
        if (err) return res.status(500).json(err);
        //return res.status(200).json("Updated Successfully");
        transporter.sendMail(info, (err, data) => {
          if (err) return res.status(500).json(err);
          return res.status(200).json("mail sent");
        });
      });
      // console.log("else block");
      // console.log("proRenewDate < today : ", proRenewDate < today);
      // console.log(proRenewDate , today);
    }

  });
};

export const updateProListingMultipleStatus = (req, res) => {
  const { pro_listed, listingids } = req.body;

  // Validate input
  if (!Array.isArray(listingids) || listingids.length === 0) {
    return res.status(400).json({ error: "Invalid property IDs" });
  }

  // Create a placeholder for SQL IN clause
  const placeholders = listingids.map(() => "?").join(",");
  const q = `UPDATE property_module SET pro_listed = ? WHERE pro_id IN (${placeholders})`;
  const values = [pro_listed, ...listingids];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json(err);
    }
    return res.status(200).json("Updated Successfully");
  });
};

export const updateSaleStatus = (req, res) => {
  const q =
    "UPDATE property_module SET pro_sale_status = ?, pro_listed = ? WHERE pro_id = ?";
  const values = [req.body.sale_status, 0, req.body.pro_id];
  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Updated Successfully");
  });
};

export const updateMultipleSaleStatus = (req, res) => {
  const { sale_status, listingids } = req.body;

  // Validate input
  if (!Array.isArray(listingids) || listingids.length === 0) {
    return res.status(400).json({ error: "Invalid property IDs" });
  }

  // Create a placeholder for SQL IN clause
  const placeholders = listingids.map(() => "?").join(",");
  const q = `UPDATE property_module SET pro_sale_status = ?, pro_listed = ? WHERE pro_id IN (${placeholders}) and pro_sale_status = (${!sale_status})`;
  const values = [sale_status, 0, ...listingids, !sale_status];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json(err);
    }
    return res.status(200).json("Updated Successfully");
  });
};

const updateProPlanStatus = (res) => {
  const updateData =
    "update list_plan_transactions set plan_status = 0 where DATEDIFF(CONVERT_TZ(list_plan_starts_on,'+00:00', '+05:30'), CONVERT_TZ(NOW(), '+00:00', '+05:30')) < -list_plan_valid_for_days ;";
  db.query(updateData, (err, data) => {
    if (err) return res.status(500).json(err);
  });
};

// export const fetchPropertiesAddInLast30Days = (req, res) => {
//   updateProPlanStatus();
//   console.log("req.params.userId : ", req.params.userId);
//   const q = `SELECT
//     COUNT(property_module.pro_id) AS pro_count,
//     property_module.pro_creation_date,
//     DATEDIFF(CONVERT_TZ(property_module.pro_creation_date, '+00:00', '+05:30'), CONVERT_TZ(NOW(), '+00:00', '+05:30')) AS Days,
//     -- list_plan_transactions.pro_plan_added_slots ,
// --     list_plan_transactions.plan_status ,
//     COALESCE(list_plan_transactions.pro_plan_added_slots, 0) AS pro_plan_added_slots,
//     COALESCE(list_plan_transactions.plan_status, 0) AS plan_status,
//     COALESCE(list_plan_transactions.list_plan_starts_on, 0) AS list_plan_starts_on,
//     coalesce(total_no_pro_user_can_add, 0) as total_no_pro_user_can_add
// FROM
//     property_module
// LEFT JOIN
//     list_plan_transactions ON list_plan_transactions.user_id = property_module.pro_user_id and (list_plan_transactions.plan_status = 1 OR list_plan_transactions.plan_status = 2 )
// WHERE
//     DATEDIFF(property_module.pro_creation_date, CONVERT_TZ(NOW(), '+00:00', '+05:30')) > -30
//     AND property_module.pro_user_id = ?
// LIMIT 1;`;
//   db.query(q, [req.params.userId], (err, data) => {
//     if (err) return res.status(500).json(err);
//     return res.status(200).json(data);
//   });
// };

export const fetchPropertiesAddInLast30Days = (req, res) => {
  updateProPlanStatus();
  console.log("req.params.userId : ", req.params.userId);
  const q = `SELECT 
  COUNT(property_module.pro_id) AS pro_count, 
  property_module.pro_creation_date, 
  DATEDIFF(CONVERT_TZ(property_module.pro_creation_date, '+00:00', '+05:30'), CONVERT_TZ(NOW(), '+00:00', '+05:30')) AS Days, 
  -- list_plan_transactions.pro_plan_added_slots ,
--     list_plan_transactions.plan_status ,
  COALESCE(list_plan_transactions.pro_plan_added_slots, 0) AS pro_plan_added_slots,
  COALESCE(list_plan_transactions.plan_status, 0) AS plan_status,
  COALESCE(list_plan_transactions.list_plan_starts_on, 0) AS list_plan_starts_on,
  coalesce(total_no_pro_user_can_add, 0) as total_no_pro_user_can_add,
  tran_id
FROM 
  property_module 
LEFT JOIN 
  ( select * from list_plan_transactions where user_id = ? order by tran_id desc limit 1) as list_plan_transactions ON list_plan_transactions.user_id = property_module.pro_user_id and (list_plan_transactions.plan_status = 1 OR list_plan_transactions.plan_status = 2 )
WHERE 
  DATEDIFF(property_module.pro_creation_date, CONVERT_TZ(NOW(), '+00:00', '+05:30')) > -30 
  AND property_module.pro_user_id = ?;`;
  db.query(q, [req.params.userId, req.params.userId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};
