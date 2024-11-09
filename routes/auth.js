const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

// Logout rotası
router.get("/logout", authController.logout);

router.post("/update", authController.update);

module.exports = router;
