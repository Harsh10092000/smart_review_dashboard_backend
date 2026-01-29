// //import jwt from "jsonwebtoken";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import { jwtDecode } from "jwt-decode";

import cookieParser from 'cookie-parser';

const secretKey = "sdfhj@j13j24";
const secretKey1 = "fghf12223";

const hashOtp = async (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

export const genrateAccessToken = async (reqbody, res) => {
  try {
        const hashedOTP = await hashOtp(reqbody[0].login_otp);
        const payload = {
          login_id: reqbody[0].login_id,
          login_email: reqbody[0].login_email,
          login_otp: hashedOTP,
          login_number: reqbody[0].login_number,
          free_listings_remaining: reqbody[0].free_listings_remaining,
          active_plan_id: reqbody[0].active_plan_id,
          plan_validity_end: reqbody[0].plan_validity_end,
          paid_listings_remaining: reqbody[0].paid_listings_remaining,
          is_lifetime_free: reqbody[0].is_lifetime_free
          //user_type: reqbody[0].user_type,
        };

    const token = jwt.sign(payload, secretKey, {
      expiresIn: "15d",
    });

    const refreshToken = jwt.sign({
      login_otp: hashedOTP,
  }, secretKey, { expiresIn: '1d' });

    console.log(token,refreshToken);
    // res.cookie('jwt' , refreshToken , {httponly: true, maxAge : 24 * 60 * 60 * 1000})
    try {


      res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

      console.log("saved in cookie");
  } catch (error) {
    
      console.error('Error occurred:', error);
  }
    const decodedToken = jwtDecode(token);
    const expiresAt = decodedToken.exp;
    console.log("decodedToken : ", decodedToken);
    //const verifiedToken = jwt.verify(token, secretKey1);
    //console.log("verifiedToken : " , verifiedToken);

    try {
      const verifiedToken = jwt.verify(token, secretKey);
      console.log("verifiedToken : ", verifiedToken);
      return { message: "Authentication successful!", token, expiresAt, refreshToken };
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  } catch (error) {
    return error;
  }
};






// import jwt from "jsonwebtoken";
// import jwt from 'jsonwebtoken';
// import bcrypt from "bcrypt";
// import { jwtDecode } from "jwt-decode";
// import macaddress from 'macaddress';
// import cookieParser from 'cookie-parser';
// import CryptoJS from "crypto-js";
// const secretKey = "sdfhj@j13j24";
// const secretKey1 = "fghf12223";

// const hashOtp = async (password) => {
//   return new Promise((resolve, reject) => {
//     bcrypt.genSalt(12, (err, salt) => {
//       if (err) {
//         reject(err);
//       }
//       bcrypt.hash(password, salt, (err, hash) => {
//         if (err) {
//           reject(err);
//         }
//         resolve(hash);
//       });
//     });
//   });
// };

// const encryptAES = (plaintext) => {
//   const key = process.env.EMAIL_CONFIG_KEY_1;
//   const salt = CryptoJS.lib.WordArray.random(128 / 8);
//   const keyWithSalt = CryptoJS.PBKDF2(key, salt, {
//     keySize: 256 / 32,
//     iterations: 1000,
//   });
//   const encrypted = CryptoJS.AES.encrypt(plaintext, keyWithSalt, {
//     iv: salt,
//   }).toString();
//   const saltedEncrypted = salt.toString(CryptoJS.enc.Base64) + encrypted;
//   return saltedEncrypted;
// };


// export const genrateAccessToken = async (reqbody, res) => {
//   let mid = "";
//   macaddress.one(function (err, mac) {
//     mid = mac;
//     console.log("Mac address for this host: %s", mac);  
//   });
//   try {
//         const hashedOTP = await hashOtp(reqbody[0].login_otp);
//         const hashedMac =  encryptAES(mid);
//         const payload = {
//           login_id: reqbody[0].login_id,
//           login_email: reqbody[0].login_email,
//           login_otp: hashedOTP,
//           login_number: reqbody[0].login_number,
//           hashedMac: hashedMac,
//           //user_type: reqbody[0].user_type,
//         };

    
//     const token = jwt.sign(payload, secretKey, {
//       expiresIn: "15d",
//     });

//     const refreshToken = jwt.sign({
//       login_otp: hashedOTP,
//   }, secretKey, { expiresIn: '1d' });

//     console.log(token,refreshToken);
//     // res.cookie('jwt' , refreshToken , {httponly: true, maxAge : 24 * 60 * 60 * 1000})
//     try {


//       res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

//       console.log("saved in cookie");
//   } catch (error) {
    
//       console.error('Error occurred:', error);
//   }
//     const decodedToken = jwtDecode(token);
//     const expiresAt = decodedToken.exp;
//     console.log("decodedToken : ", decodedToken);
//     //const verifiedToken = jwt.verify(token, secretKey1);
//     //console.log("verifiedToken : " , verifiedToken);

//     try {
//       const verifiedToken = jwt.verify(token, secretKey);
//       console.log("verifiedToken : ", verifiedToken);
//       return { message: "Authentication successful!", token, expiresAt, refreshToken };
//     } catch (error) {
//       console.error("Token verification failed:", error);
//     }
//   } catch (error) {
//     return error;
//   }
// };
