const express = require("express");
const mysql = require("mysql");
const router = express.Router();
//const db = require("../db"); // Veritabanı bağlantı dosyanız
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Cihaz ekleme işlemi
router.post("/devices/add", (req, res) => {
  const { device_name, model, mac_address, city } = req.body;

  // Hataları konsolda görmek için loglama yapalım
  console.log("Received data:", { device_name, model, mac_address, city });

  const addDeviceQuery = `
    INSERT INTO devices (device_name, model, mac_address, location)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    addDeviceQuery,
    [device_name, model, mac_address, city],
    (err, result) => {
      if (err) {
        console.error("Error executing query:", addDeviceQuery); // Sorgu mesajı
        console.error("Error details:", err); // Hata detayları
        return res.status(500).send("Error adding device.");
      }
      res.redirect("/devices");
    }
  );
});

module.exports = router;
