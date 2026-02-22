import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authProperty from "./routes/property.js";
import authAdmin from "./routes/admin.js";
import authSettings from "./routes/settings.js"
import authListing from "./routes/listing.js"
import marketingRoutes from "./routes/marketing.js"
import authAuth from "./routes/auth.js"
import authProfile from "./routes/profile.js"

const app = express();
// var corsOptions = {
//     origin: '*',  
// };
// app.use(cors(corsOptions));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4177',
    'http://localhost:3000', // Website
    'https://smartreviewpanel.bizease.com',
    'https://smartreviewpanelapi.bizease.com'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
// app.use(cors({
//   origin: 'http://dashboard.example.com',
//   credentials: true,
// }));
app.use(express.static("./public", {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.use("/api/auth", authAuth);
app.use("/api/profile", authProfile);
app.use("/api/pro", authProperty);
app.use("/api/admin", authAdmin);
app.use("/api/setting", authSettings);

import authUsers from "./routes/users.js";
import authSubscription from "./routes/subscription.js";

app.use("/api/marketing", marketingRoutes);
app.use("/api/users", authUsers);
app.use("/api/subscription", authSubscription);

import keywordsRoutes from "./routes/keywords.js";
app.use("/api/keywords", keywordsRoutes);

app.listen(8025, () => {
  console.log("App is running ");
});