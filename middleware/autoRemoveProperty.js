import { db } from "../connect";
import { transporter } from "../nodemailer";
const val = 700;
export const autoRemoveProperty = (res, next) => {
  let emailData = "";
  // const getMailData = `SELECT pro_id, pro_renew_date, 
  //       DATEDIFF(pro_renew_date, DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))) AS days_until_renewal
  //       FROM property_module;`;
  const getMailData = `SELECT distinct login_email , DATEDIFF(pro_renew_date, DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))) AS days_until_renewal 
  FROM property_module left join login_module on login_module.login_id = property_module.pro_user_id 
  WHERE DATEDIFF(pro_renew_date, DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))) = 2;` 

  db.query(getMailData, (err, mailData) => {
    if (err) return res.status(500).json(err);
    mailData.map((item) => {
      emailData = item.login_email;
    });
    let info = {
      from: '"Propertyease " <noreply@propertyease.in>',
      to: "harshgupta.calinfo@gmail.com",
      //to: "sbpb136118@gmail.com,dhamija.piyush7@gmail.com",
      //to: req.body.pro_user_email,
      subject: `Property expired in 2 days`,
      html: `property expired after 2 days`,
    };

    transporter.sendMail(info, (err, data) => {
      if (err) return res.status(500).json(err);
      next();
    });
  });
  // const updateData =
  //   `update property_module set pro_listed = 0 where DATEDIFF(pro_creation_date,pro_renew_date) = -1 ;`;
  // db.query(updateData, (err, data) => {
  //   if (err) return res.status(500).json(err);
  //   next();
  //if (data.length < 1) return false;
  // const q =
  //   "DELETE FROM agent_work_city__subdistrict WHERE agent_cnct_id = ?;";
  // db.query(q, id, (err, data) => {
  //   if (err) return res.status(500).json(err);
  // });
  // });
};
