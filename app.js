const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session"); // Oturum yönetimi için
const db = require("./db");
dotenv.config({ path: "./.env" });

const app = express();

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));
//Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));
//Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Oturum yönetimi middleware
app.use(
  session({
    secret: "yourSecretKey", // Gizli anahtar belirle
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 gün geçerli oturum
  })
);

app.set("view engine", "hbs");

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MYSQL is connected");
  }
});

//Define Routes
app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/deviceRoutes"));
app.use("/", require("./routes/userDeviceRoutes"));
app.listen(5001, () => {
  console.log("Server started on Port 5001");
});
