const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});
router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

//Middleware
const { isLoggedIn, isAdmin } = require("../middleware/auth");

router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", {
    username: req.session.username,
  });
});

router.get("/", isLoggedIn, (req, res) => {
  res.render("index", {
    username: req.session.username,
  });
});
router.get("/devices/add", isAdmin, (req, res) => {
  res.render("addDevice", {
    username: req.session.username,
  });
});
router.get("/devices", isAdmin, (req, res) => {
  res.render("devices", {
    username: req.session.username,
  });
});

module.exports = router;
