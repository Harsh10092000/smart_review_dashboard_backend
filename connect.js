


//import { createPool } from "mysql";

// export const db = createPool({
//   host: "194.59.164.60",
//   user: "u414768521_landmark_pro",
//   password: "Gw[3H&SEBfT",
//   database: "u414768521_landmark_pro",
//   waitForConnections: true,
//   connectionLimit: 10000,
// });

// import mysql from "mysql2";
// export const db = mysql.createPool({
//   host: "193.203.166.208",
//   user: "u706648698_landmark_plots",
//   password: "6k@Z/*6VN+a9",
//   database: "u706648698_landmark_plots",
//   waitForConnections: true,
//   connectionLimit: 10000
// });


import mysql from "mysql2";
export const db = mysql.createPool({
  host: "193.203.166.208",
  user: "u706648698_review_gen_db",
  password: "2NeB3$eX&",
  database: "u706648698_review_gen_db",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 30000,       // 30s timeout on new connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000 // send keep-alive ping every 10s
});



