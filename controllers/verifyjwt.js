import jwt from 'jsonwebtoken';



// export const verifyJwt = (req,res) => {
//     const secretKey = "harsh123";
//     console.log("secretKey : " , secretKey);
//     const token = req.headers['x-access-token']
  
//     const obj = JSON.parse(token);
//   const extractedToken = obj.token;

//   try {
    
//     const verifiedToken = jwt.verify(extractedToken, secretKey);
//     console.log("verifiedToken jwt.jsx : " , verifiedToken);
    
// } catch (error) {
//     // console.error("Token verification failed 3333333333 :", error);
//     console.log("Token verification failed 3333333333 ");
//     //return res.redirect("http://localhost:5173/login");
//     //return res.redirect("http://localhost:5173/login");
//     return res.status(200).json("failed");
// }
// }

export const verifyJwt = (req,res, next) => {
  const secretKey = "sdfhj@j13j24";
  console.log("secretKey : " , secretKey);
  const token = req.headers['x-access-token']

  const obj = JSON.parse(token);
const extractedToken = obj.token;

console.log(extractedToken)

try {
  console.log("verifiedToken jwt.jsx in process ");
  const verifiedToken = jwt.verify(extractedToken, secretKey);
  console.log("verifiedToken jwt.jsx : " , verifiedToken);
  next();
} catch (error) {
  
  //return res.status(403).json("failed");
  console.log("failed")
  //res.redirect('http://localhost:5173/login');
  //res.status(302).redirect('http://localhost:5173/notfound');
  return res.status(200).json("failed");
}
}







// import jwt from 'jsonwebtoken';
// import macaddress from 'macaddress';
// import bcrypt from "bcrypt";
// import { jwtDecode } from "jwt-decode";
// import CryptoJS from "crypto-js";
// import "dotenv/config";

// // export const verifyJwt = (req,res) => {
// //     const secretKey = "harsh123";
// //     console.log("secretKey : " , secretKey);
// //     const token = req.headers['x-access-token']
  
// //     const obj = JSON.parse(token);
// //   const extractedToken = obj.token;

// //   try {
    
// //     const verifiedToken = jwt.verify(extractedToken, secretKey);
// //     console.log("verifiedToken jwt.jsx : " , verifiedToken);
    
// // } catch (error) {
// //     // console.error("Token verification failed 3333333333 :", error);
// //     console.log("Token verification failed 3333333333 ");
// //     //return res.redirect("http://localhost:5173/login");
// //     //return res.redirect("http://localhost:5173/login");
// //     return res.status(200).json("failed");
// // }
// // }

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

// const decryptAES = async (saltedEncrypted, key) => {
  
//   const salt = CryptoJS.enc.Base64.parse(saltedEncrypted.substring(0, 24));
//   const encrypted = saltedEncrypted.substring(24);
//   const keyWithSalt = CryptoJS.PBKDF2(key, salt, {
//     keySize: 256 / 32,
//     iterations: 1000,
//   });
//   const decrypted = CryptoJS.AES.decrypt(encrypted, keyWithSalt, {
//     iv: salt,
//   }).toString(CryptoJS.enc.Utf8);
//   return decrypted;
// };

// export const verifyJwt = async (req,res, next) => {
//   let mid = "";
//   macaddress.one(function (err, mac) {
//     mid = mac;
//     console.log("Mac address for this host: %s", mac);  
//   });
//   const cdfgd = process.env.EMAIL_CONFIG_KEY_1;
//   //const hashedMac = await hashOtp(mid);
  
//   const secretKey = "sdfhj@j13j24";
//   console.log("secretKey : " , secretKey);
//   const token = req.headers['x-access-token']

//   const obj = JSON.parse(token);
// const extractedToken = obj.token;

// console.log(extractedToken)

// try {
//   console.log("verifiedToken jwt.jsx in process ");
//   const verifiedToken = jwt.verify(extractedToken, secretKey);
//   console.log("verifiedToken jwt.jsx : " , verifiedToken );
//   const decyptedMac = await decryptAES(verifiedToken.hashedMac, cdfgd);
//   if(decyptedMac === mid) {
//     console.log("mac address verified : " ,decyptedMac , mid);
//     next();
//   } else {
//     console.log("mac address is not verified 11111 : " , decyptedMac)
//     console.log("mac address is not verified 22222 : " , mid)
//     return res.status(200).json("failed");
//   }
  
// } catch (error) {
  
//   //return res.status(403).json("failed");
//   console.log("failed")
//   //res.redirect('http://localhost:5173/login');
//   //res.status(302).redirect('http://localhost:5173/notfound');
//   return res.status(200).json("failed");
// }
// }