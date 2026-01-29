import nodemailer from "nodemailer";
import "dotenv/config";



export const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  debug: true
});


// transporter.verify((error, success) => {
//   if (error) {
//       console.error('Server not reachable:', error);
//   } else {
//       console.log('Server is ready to take messages');
//   }
// });


export const digesttransporter = nodemailer.createTransport({
  host: process.env.BROADCAST_HOST,
  port: process.env.BROADCAST_PORT,
  secure: false,
  auth: {
    user: process.env.BROADCAST_EMAIL,
    pass: process.env.BROADCAST_PASSWORD,
  },
});

