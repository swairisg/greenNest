const express = require("express");
const router = express.Router();

// existing controllers
const { login, logout } = require("../../Controllers/auth/loginController");

// NEW: public customer signup controller
const {
  customerSignup,
} = require("../../Controllers/auth/publicSignup.controller");

// routes
router.post("/login", login);
router.post("/logout", logout);

// NEW: public customer sign-up
router.post("/signup", customerSignup);

// optional health
router.get("/health", (_req, res) => res.json({ ok: true }));

module.exports = router;
