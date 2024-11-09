const express = require("express");
const mysql = require("mysql");
const router = express.Router();
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});
//Middleware
const { isLoggedIn, isAdmin } = require("../middleware/auth");
// Kullanıcı cihaz ekleme formunu gösterme
router.get("/user/devices/add", isLoggedIn, (req, res) => {
  res.render("addUserDevice"); // Kullanıcı cihaz ekleme formunu render ediyoruz
});

// Kullanıcı cihaz ekleme işlemi (MAC adresine göre)
router.post("/user/devices/add", (req, res) => {
  const { mac_address } = req.body;
  const user_id = req.session.userId; // Oturumdaki kullanıcıyı alıyoruz

  const findDeviceQuery = `
    SELECT * FROM devices WHERE mac_address = ?
  `;

  db.query(findDeviceQuery, [mac_address], (err, result) => {
    if (err || result.length === 0) {
      console.error("Error finding device or device not found.");
      return res.status(500).send("Cihaz bulunamadı.");
    }

    const device_id = result[0].device_id;

    // Cihazı kullanıcı cihazlarına ekliyoruz
    const addUserDeviceQuery = `
      INSERT INTO user_devices (user_id, device_id)
      VALUES (?, ?)
    `;

    db.query(addUserDeviceQuery, [user_id, device_id], (err, result) => {
      if (err) {
        console.error("Error adding device to user.");
        return res.status(500).send("Cihaz eklenemedi.");
      }
      res.redirect("/user/devices");
    });
  });
});

// Kullanıcının cihazlarını listeleme
router.get("/user/devices", (req, res) => {
  const user_id = req.session.userId; // Oturumdaki kullanıcıyı alıyoruz

  if (!user_id) {
    //res.status(401).send("Kullanıcı oturumu açılmamış.");
    res.redirect("/login");
  }

  let baseQuery = `
    SELECT devices.device_name, devices.mac_address, devices.model, devices.location
    FROM user_devices
    JOIN devices ON user_devices.device_id = devices.device_id
    WHERE user_devices.user_id = ?
  `;

  baseQuery += " ORDER BY devices.device_name ASC";

  db.query(baseQuery, [user_id], (err, result) => {
    if (err) {
      console.error("Cihazlar getirilemedi.", err);
      return res.status(500).send("Cihazlar getirilemedi.");
    }

    res.render("userDevices", { devices: result });
  });
});
/*
// Alarm kaydetme fonksiyonu (örnek bir kullanım)
router.post("/user/devices/alarm", (req, res) => {
  const { mac_address, alarm_type } = req.body;

  // İlk olarak mac_address'e göre device_id'yi al
  const findDeviceQuery = `
    SELECT device_id FROM devices WHERE mac_address = ?
  `;

  db.query(findDeviceQuery, [mac_address], (err, result) => {
    if (err || result.length === 0) {
      console.error("Device not found or error occurred.");
      return res.status(500).send("Device not found.");
    }

    const device_id = result[0].device_id;

    // Alarmlar tablosuna alarm ekle
    const insertAlarmQuery = `
      INSERT INTO alarms (device_id, alarm_type, timestamp)
      VALUES (?, ?, NOW())
    `;

    db.query(insertAlarmQuery, [device_id, alarm_type], (err, result) => {
      if (err) {
        console.error("Error inserting alarm:", err);
        return res.status(500).send("Error inserting alarm.");
      }

      res.send("Alarm successfully added.");
    });
  });
});
*/

router.get("/user/devices/alarms", (req, res) => {
  const user_id = req.session.userId;
  const role = req.session.role;

  // Filtreleme ve sıralama parametrelerini al
  const {
    dateFilter,
    alarmTypeFilter,
    locationFilter,
    deviceNameFilter,
    sortOrder,
  } = req.query;

  // Tarih filtresi için SQL koşulları
  let dateCondition = "";
  if (dateFilter === "24hours") {
    dateCondition = "AND alarms.timestamp >= NOW() - INTERVAL 1 DAY";
  } else if (dateFilter === "1week") {
    dateCondition = "AND alarms.timestamp >= NOW() - INTERVAL 1 WEEK";
  } else if (dateFilter === "1month") {
    dateCondition = "AND alarms.timestamp >= NOW() - INTERVAL 1 MONTH";
  }

  // Alarm türü filtresi için SQL koşulu
  let alarmTypeCondition = "";
  if (alarmTypeFilter) {
    alarmTypeCondition = `AND alarms.alarm_type = '${alarmTypeFilter}'`;
  }

  // Konum filtresi için SQL koşulu
  let locationCondition = "";
  if (locationFilter) {
    locationCondition = `AND devices.location = '${locationFilter}'`;
  }

  // Cihaz adı filtresi için SQL koşulu
  let deviceNameCondition = "";
  if (deviceNameFilter) {
    deviceNameCondition = `AND devices.device_name LIKE '%${deviceNameFilter}%'`;
  }

  // Sıralama koşulu
  let orderBy = "ORDER BY alarms.timestamp DESC"; // Varsayılan sıralama
  if (sortOrder === "date_asc") {
    orderBy = "ORDER BY alarms.timestamp ASC";
  } else if (sortOrder === "alarm_type") {
    orderBy = "ORDER BY alarms.alarm_type";
  } else if (sortOrder === "device_name_asc") {
    orderBy = "ORDER BY devices.device_name ASC";
  } else if (sortOrder === "device_name_desc") {
    orderBy = "ORDER BY devices.device_name DESC";
  }

  // Kullanıcının admin olup olmadığına göre sorgu
  if (role === "admin") {
    const adminAlarmsQuery = `
      SELECT devices.device_name, alarms.alarm_type, devices.location, alarms.timestamp
      FROM devices
      JOIN alarms ON devices.device_id = alarms.device_id
      WHERE 1=1 ${dateCondition} ${alarmTypeCondition} ${locationCondition} ${deviceNameCondition}
      ${orderBy}
    `;

    db.query(adminAlarmsQuery, (err, result) => {
      if (err) {
        console.error("Tüm cihazların alarm verileri getirilemedi.", err);
        return res.status(500).send("Alarm verileri getirilemedi.");
      }

      res.render("userDeviceAlarms", { alarms: result });
    });

    return; // Admin sorgusu yapıldı, diğer sorguya geçme
  }

  // Kullanıcının kendi cihazlarına ait alarmları getir
  const userAlarmsQuery = `
    SELECT devices.device_name, devices.location, alarms.alarm_type, alarms.timestamp
    FROM user_devices
    JOIN devices ON user_devices.device_id = devices.device_id
    JOIN alarms ON devices.device_id = alarms.device_id
    WHERE user_devices.user_id = ? ${dateCondition} ${alarmTypeCondition} ${locationCondition} ${deviceNameCondition}
    ${orderBy}
  `;

  db.query(userAlarmsQuery, [user_id], (err, result) => {
    if (err) {
      console.error("Kullanıcı cihazlarının alarm verileri getirilemedi.", err);
      return res.status(500).send("Alarm verileri getirilemedi.");
    }

    res.render("userDeviceAlarms", { alarms: result });
  });
});

module.exports = router;
