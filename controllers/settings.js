import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";
import "dotenv/config";
import { db } from "../connect.js";

const decryptAES = (saltedEncrypted, key) => {
  const salt = CryptoJS.enc.Base64.parse(saltedEncrypted.substring(0, 24));
  const encrypted = saltedEncrypted.substring(24);
  const keyWithSalt = CryptoJS.PBKDF2(key, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  });
  const decrypted = CryptoJS.AES.decrypt(encrypted, keyWithSalt, {
    iv: salt,
  }).toString(CryptoJS.enc.Utf8);
  return decrypted;
};

export const emailConfigSetting = (req, res) => {
  const cdfgd = process.env.EMAIL_CONFIG_KEY_1;

  const decryptedHost =
    '"' + decryptAES(req.body.email_config_host, cdfgd) + '"';
  const decryptedPassword =
    '"' + decryptAES(req.body.email_config_new_pass, cdfgd) + '"';
  const decryptedEmail =
    '"' + decryptAES(req.body.email_config_email, cdfgd) + '"';
  const decryptedPort = decryptAES(req.body.email_config_port, cdfgd);

  const envFilePath = ".env";
  let envFileContent = fs.readFileSync(envFilePath, "utf8");

  if (
    decryptAES(req.body.email_config_old_pass, cdfgd) === process.env.PASSWORD
  ) {
    envFileContent = removeExistingEntries(envFileContent, [
      "EMAIL",
      "PASSWORD",
      "HOST",
      "PORT",
    ]);

    envFileContent += "";
    envFileContent += `${"EMAIL"}=${decryptedEmail}\n`;
    envFileContent += `${"PASSWORD"}=${decryptedPassword}\n`;
    envFileContent += `${"HOST"}=${decryptedHost}\n`;
    envFileContent += `${"PORT"}=${decryptedPort}\n`;
    envFileContent += "";

    fs.writeFileSync(envFilePath, envFileContent, "utf8");

    return res.status(200).json("done");
  } else {
    return res.status(401).json("Old password is incorrect");
  }
};

function removeExistingEntries(envFileContent, keys) {
  keys.forEach((key) => {
    const existingKeyRegex = new RegExp(`^${key}=.*$`, "gm");
    envFileContent = envFileContent.replace(existingKeyRegex, "");
  });
  envFileContent = envFileContent.replace(/^\s*[\r\n]/gm, "");
  return envFileContent;
}

// RAZORPAY_API_KEY= "rzp_test_85bCZrDsYz9ybF"
// RAZORPAY_API_SECRET= "XL4cfnC2o1jGuioA0E1X8cdC"

// #RAZORPAY_API_SECRET= "nlDVdxL6QDPm36Ae2ID1Eih4"
// #RAZORPAY_API_KEY= "rzp_live_ALzPxuAS54iJhF"

// #test

export const emailConfigSetting2 = (req, res) => {
  const cdfgd = process.env.EMAIL_CONFIG_KEY_1;

  const decryptedHost =
    '"' + decryptAES(req.body.email_config_host, cdfgd) + '"';
  const decryptedPassword =
    '"' + decryptAES(req.body.email_config_new_pass, cdfgd) + '"';
  const decryptedEmail =
    '"' + decryptAES(req.body.email_config_email, cdfgd) + '"';
  const decryptedPort = decryptAES(req.body.email_config_port, cdfgd);

  const envFilePath = ".env";
  let envFileContent = fs.readFileSync(envFilePath, "utf8");

  if (
    decryptAES(req.body.email_config_old_pass, cdfgd) ===
    process.env.BROADCAST_PASSWORD
  ) {
    envFileContent = removeExistingEntries2(envFileContent, [
      "BROADCAST_EMAIL",
      "BROADCAST_PASSWORD",
      "BROADCAST_HOST",
      "BROADCAST_PORT",
    ]);

    envFileContent += "";
    envFileContent += `${"BROADCAST_EMAIL"}=${decryptedEmail}\n`;
    envFileContent += `${"BROADCAST_PASSWORD"}=${decryptedPassword}\n`;
    envFileContent += `${"BROADCAST_HOST"}=${decryptedHost}\n`;
    envFileContent += `${"BROADCAST_PORT"}=${decryptedPort}\n`;
    envFileContent += "";

    fs.writeFileSync(envFilePath, envFileContent, "utf8");

    return res.status(200).json("done");
  } else {
    return res.status(401).json("Old password is incorrect");
  }
};

function removeExistingEntries2(envFileContent, keys) {
  keys.forEach((key) => {
    const existingKeyRegex = new RegExp(`^${key}=.*$`, "gm");
    envFileContent = envFileContent.replace(existingKeyRegex, "");
  });
  envFileContent = envFileContent.replace(/^\s*[\r\n]/gm, "");
  return envFileContent;
}

export const emailConfigBroadcastSetting = (req, res) => {
  const cdfgd = process.env.EMAIL_CONFIG_KEY_1;
  const decryptedName =
    '"' + decryptAES(req.body.email_sender_name, cdfgd) + '"';
  const decryptedSubject =
    '"' + decryptAES(req.body.email_subject, cdfgd) + '"';
  const decryptedDays = decryptAES(req.body.email_days, cdfgd);
  const decryptedEmail =
    '"' + decryptAES(req.body.email_sender_id, cdfgd) + '"';
  //const decryptedTime = decryptAES(req.body.value, cdfgd);

  const envFilePath = ".env";
  let envFileContent = fs.readFileSync(envFilePath, "utf8");

  envFileContent = removeExistingBroadEntries(envFileContent, [
    "SEND_NEW_LISTING_EMAIL_EVERYTIME",
    "BROADCAST_SENDER_EMAIL",
    "BROADCAST_EMAIL_SUBJECT",
    "BROADCAST_EMAIL_HR",
    "BROADCAST_EMAIL_MIN",
    "BROADCAST_EMAIL_DAYS",
    "BROADCAST_SENDER_EMAIL_NAME",
  ]);

  console.log(req.body.email_time);

  envFileContent += "";
  envFileContent += `${"SEND_NEW_LISTING_EMAIL_EVERYTIME"}=0\n`;
  envFileContent += `${"BROADCAST_SENDER_EMAIL_NAME"}=${decryptedName}\n`;

  envFileContent += `${"BROADCAST_SENDER_EMAIL"}=${decryptedEmail}\n`;
  envFileContent += `${"BROADCAST_EMAIL_SUBJECT"}=${decryptedSubject}\n`;
  envFileContent += `${"BROADCAST_EMAIL_HR"}=${req.body.email_hr}\n`;
  envFileContent += `${"BROADCAST_EMAIL_MIN"}=${req.body.email_min}\n`;
  envFileContent += `${"BROADCAST_EMAIL_DAYS"}=${decryptedDays}\n`;
  envFileContent += "";

  fs.writeFileSync(envFilePath, envFileContent, "utf8");

  return res.status(200).json("done");
};

function removeExistingBroadEntries(envFileContent, keys) {
  keys.forEach((key) => {
    const existingKeyRegex = new RegExp(`^${key}=.*$`, "gm");
    envFileContent = envFileContent.replace(existingKeyRegex, "");
  });
  envFileContent = envFileContent.replace(/^\s*[\r\n]/gm, "");
  return envFileContent;
}

export const sendEmailPermissions = (req, res) => {
  const envFilePath = ".env";
  let envFileContent = fs.readFileSync(envFilePath, "utf8");
  envFileContent = removeExistingBroadPer(envFileContent, [
    "SEND_NEW_LISTING_EMAIL_EVERYTIME",
  ]);

  envFileContent += "";
  envFileContent += `${"SEND_NEW_LISTING_EMAIL_EVERYTIME"}=1\n`;
  envFileContent += "";

  fs.writeFileSync(envFilePath, envFileContent, "utf8");

  return res.status(200).json("done");
};

function removeExistingBroadPer(envFileContent, keys) {
  keys.forEach((key) => {
    const existingKeyRegex = new RegExp(`^${key}=.*$`, "gm");
    envFileContent = envFileContent.replace(existingKeyRegex, "");
  });
  envFileContent = envFileContent.replace(/^\s*[\r\n]/gm, "");
  return envFileContent;
}

export const fetchSubscriberList = (req, res) => {
  const q = "SELECT * FROM mail_subscriber";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};


export const fetchSubscriberDataById = (req, res) => {
  
  const q = "SELECT * FROM mail_subscriber where sub_email = ?";
  db.query(q, [req.params.subEmail], (err, data) => {
    if (err) return res.status(500).json(err);
   
    if(data.length > 0) {
      return res.status(200).json(true);
    } else {
      return res.status(200).json(false);
    }
    
  });
};


export const emailGloablSetting = (req, res) => {
  const cdfgd = process.env.EMAIL_CONFIG_KEY_1;

  console.log(req.body);

  const decryptnName =
    '"' + decryptAES(req.body.email_sender_name, cdfgd) + '"';
  const decryptSenderId =
    '"' + decryptAES(req.body.email_sender_id, cdfgd) + '"';
  // const decryptRecieverId =
  //   '"' + decryptAES(req.body.email_reciever_id, cdfgd) + '"';

  const envFilePath = ".env";
  let envFileContent = fs.readFileSync(envFilePath, "utf8");

  envFileContent = removeExistingEntries(envFileContent, [
    "GLOBAL_EMAIL_SENDER_NAME",
    "GLOBAL_EMAIL_SENDER_ID",
    "GLOBAL_EMAIL_RECIEVER_ID",
  ]);

  envFileContent += "";
  envFileContent += `${"GLOBAL_EMAIL_SENDER_NAME"}=${decryptnName}\n`;
  envFileContent += `${"GLOBAL_EMAIL_SENDER_ID"}=${decryptSenderId}\n`;
  envFileContent += `${"GLOBAL_EMAIL_RECIEVER_ID"}=${req.body.email_reciever_id}\n`;
  envFileContent += "";

  fs.writeFileSync(envFilePath, envFileContent, "utf8");

  return res.status(200).json("done");
};

