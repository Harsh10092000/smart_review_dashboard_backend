import { transporter } from "../nodemailer.js";
import { db } from "../connect.js";
import { genrateAccessToken } from "./jwt.js";
import axios from "axios";
import "dotenv/config"


const updateOtp = (otp, email, res) => {
   
  const q = "update login_module set login_otp = ? where login_email = ?";
  db.query(q, [otp, email], (err, data) => {
    if (err) return res.status(500).json(err);
  });
};

//var otp = Math.floor(100000 + Math.random() * 900000);

export const sendOtp = (req, res) => {
   var otp = Math.floor(100000 + Math.random() * 900000);
  let info = {
    from: '"Propertyease " <noreply@propertyease.in>', // sender address
    to: req.params.email, // list of receivers
    //to: "harshgupta.calinfo@gmail.com",
    subject: `${otp} is Your Login OTP - Propertyease`, // Subject line
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
                                     <p style="margin-bottom: 10px; font-size: 16px;">You can login now using the OTP: <b> ${otp}</b></p>
                                     <p style="margin-bottom: 10px; font-size: 16px;">Click here to login  & manage your property listing.</p>
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
 </div>`, // html body
  };

  const query1 =
    "select count(login_id) as count_login_id, login_number from login_module where login_email = ?";
  db.query(query1, [req.params.email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data[0].count_login_id !== 0) {
      var mobile_number = data[0].login_number;
      updateOtp(otp, req.params.email);
      transporter.sendMail(info, async (err, data) => {
        if (err) 
        {
        
         return res.status(500).json(err);
        }
        //const mobile_number = "7404302678";
        //sendOtpOnMobile2(data[0].login_number, otp);
        //return res.status(200).json("Otp Sent");

        console.log("sending sms")
        // send otp on mobile
        const smsResponse = await sendOtpOnMobile2(mobile_number, otp);
        console.log(smsResponse)
        if (smsResponse.success) {
          return res.status(200).json("Otp Sent 11");
        } else {
         console.log(smsResponse.message)
           return res.status(smsResponse.status || 500).json({ message: "Failed to send OTP", error: smsResponse.message });
        }
      //return res.status(200).json("Otp Sent");
      });
    } else {
      return res.status(409).json("Email doesn't Exist");
    }
  });
};

export const checkLogin = (req, res) => {
  const q =
    "SELECT * from login_module WHERE login_email = ? and login_otp = ?";
  db.query(q, [req.body.inputs.email, req.body.inputs.otp], async (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length > 0) {
      const token = await genrateAccessToken(data,res)
      
      //res.cookie('name', 'John Doe');
      return res.status(200).json({
         message: 'Authentication successful!',
         token,
         data,
       });
      //return res.status(200).json(data);
    } else {
      return res.status(409).json("Login Failed");
    }
  });
};

export const verifyEmail = (req, res) => {
  const q = "SELECT * from login_module WHERE login_email = ?";
  db.query(q, [req.params.loginEmail], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length > 0) {
      return res.status(200).json(true);
    } else {
      return res.status(409).json("Email doesn't Exist");
    }
  });
};


export const verifyNumber = (req, res) => {
  const q = "SELECT * from login_module WHERE login_number = ?";
  db.query(q, [req.params.loginNumber], (err, data) => {
    if (err) return res.status(500).json(err);
    console.log(data.length);
    if (data.length > 0) {
      return res.status(200).json(true);
    } else {
      return res.status(409).json("Not working");
    }
  });
};


export const fetchListingAccessDetails = (req, res) => {
   const q = "SELECT free_listings_remaining, plan_validity_end, paid_listings_remaining, is_lifetime_free from login_module WHERE login_email = ? and login_number = ?";
   db.query(q, [req.params.loginEmail, req.params.loginNumber], (err, data) => {
     if (err) return res.status(500).json(err);
     if (data.length > 0) {
       return res.status(200).json(data);
     } else {
       return res.status(409).json("Email doesn't Exist");
     }
   });
 };


 

export const fetchLoginData = (req, res) => {
  const q = "SELECT * from login_module";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const addUser = (req, res) => {
  var otp = Math.floor(100000 + Math.random() * 900000);
  let info = {
    from: '"Propertyease " <noreply@propertyease.in>', // sender address
    to: req.body.email, // list of receivers
    subject: "Login OTP - Propertyease", // Subject line
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
                                     <p style="margin-bottom: 10px; font-size: 16px;">You can login now using the OTP: <b> ${otp}</b></p>
                                     <p style="margin-bottom: 10px; font-size: 16px;">Click here to login  & manage your property listing.</p>
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
 </div>`, // html body
  };

  let info2 = {
   from: '"Propertyease " <noreply@propertyease.in>', // sender address

   //to: "harshgupta.calinfo@gmail.com",
   to: "sbpb136118@gmail.com,dhamija.piyush7@gmail.com", // list of receivers
   //to: req.body.pro_user_email,
   subject: `${req.body.email} has registered on Propertyease`, // Subject line
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
                               
                               <p style="margin-bottom: 10px; font-size: 16px;">A new user has registered on Propertyease. Below are the details of the new user : </p>
                         
                               <p style="margin-bottom: 10px; font-size: 16px;">User Email: ${req.body.email}</p>
                               <p style="margin-bottom: 10px; font-size: 16px;">You can Contact him/her on <a href="https://wa.me/${
                                 "91" + req.body.phone
                               }">+91-${
     req.body.phone
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


 const maxFreeListing = "SELECT max_free_listing_val FROM max_free_listing;"
  db.query(maxFreeListing, (err, data) => {
    if (err) return res.status(500).json(err);
    //return res.status(200).json(data);
    const maxfreelistingVal = data[0]?.max_free_listing_val || 5;

  const query1 =
    "INSERT INTO login_module (login_email, login_number, login_otp,free_listings_remaining) Values (?)";
  const values = [req.body.email, req.body.phone, otp, maxfreelistingVal];
  console.log(values);
  db.query(query1, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    transporter.sendMail(info, (err, data) => {
      if (err) return res.status(500).json(err);
      transporter.sendMail(info2, (err, data) => {
         if (err) return res.status(500).json(err);
         return res.status(200).json(otp);
    });
   });
  });
});
};

export const checkAdmin = (req, res) => {
  const q =
    "SELECT * from admin_module WHERE admin_email = ? AND admin_pass = ?";
  const values = [req.body.email, req.body.pass];
  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length > 0) return res.status(200).json(data);
    return res.status(404).json("Incorrect Email or Password");
  });
};





export const sendOtpOnMobile =  (req, res) => { 
   const query1 =
    "select count(login_id) as count_login_id, login_number from login_module where login_email = ?";
  db.query(query1, [req.params.email], async (err, data) => {
   //const mobile_number = "7404302678";
   //const otp = "123456";
   console.log("mobile_number : " , data[0].login_number);
   console.log("otp : " , otp);
   const url = `https://api.textlocal.in/send/?apikey=${process.env.SMS_API}&numbers=91${data[0].login_number}&sender=PROPEZ&message=` + encodeURIComponent(`Propertyease.in: ${otp} is your code for login. Your code expires in 10 minutes. Don't share your code.`);
   
   try {
      const response = await axios.get(url);
      if (response.status === 200) {
         
         return res.status(200).json("done");
      } else {
         return res.status(response.status).json("Failed to send OTP");
      }
   } catch (error) {
      console.error("Error sending OTP:", error); // Log the error for debugging
      return res.status(500).json({ message: "Failed to send OTP", error: error.message });
   }
});
};


const sendOtpOnMobile3 = async (mobile_number, otp, res) => { 
   //const mobile_number = "7404302678";
   //const otp = "123456";
   const url = `https://api.textlocal.in/send/?apikey=${process.env.SMS_API}&numbers=91${mobile_number}&sender=PROPEZ&message=` + encodeURIComponent(`Propertyease.in: ${otp} is your code for login. Your code expires in 10 minutes. Don't share your code.`);
   
   try {
      const response = await axios.get(url);
      if (response.status === 200) {
         
         return res.status(200).json("done");
      } else {
         return res.status(response.status).json("Failed to send OTP");
      }
   } catch (error) {
      console.error("Error sending OTP:", error); // Log the error for debugging
      return res.status(500).json({ message: "Failed to send OTP", error: error.message });
   }
}


const sendOtpOnMobile2 = async (mobile_number, otp) => { 
   const url = `https://api.textlocal.in/send/?apikey=${process.env.SMS_API}&numbers=91${mobile_number}&sender=PROPEZ&message=` + encodeURIComponent(`Propertyease.in: ${otp} is your code for login. Your code expires in 10 minutes. Don't share your code.`);
   
   try {
      const response = await axios.get(url);
      console.log("response : " , response)
      if (response.status === 200) {
         return { success: true };
      } else {
         return { success: false, status: response.status };
      }
   } catch (error) {
      console.error("Error sending OTP:", error);
      console.error("Error sending OTP:", error);
      return { success: false, message: error.message };
   }
};
