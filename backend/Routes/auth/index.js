const express = require("express");
const router = express.Router();
const { login, logout } = require("../../Controllers/auth/loginController");

router.post("/login", login);
router.post("/logout", logout);

// optional health
router.get("/health", (_req, res) => res.json({ ok: true }));

module.exports = router;
