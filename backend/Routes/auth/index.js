const express = require("express");
const router = express.Router();

// existing controllers
const { login, logout } = require("../../Controllers/auth/loginController");

// NEW: public customer signup controller
const {
  customerSignup,
} = require("../../Controllers/auth/publicSignup.controller");

const {
  getCustomerProfile,
  updateCustomerProfile,
} = require("../../Controllers/auth/customerProfileController");

// routes
router.post("/login", login);
router.post("/logout", logout);

// NEW: public customer sign-up
router.post("/signup", customerSignup);

// optional health
router.get("/health", (_req, res) => res.json({ ok: true }));

//update part
router.get("/profile/:id", getCustomerProfile);
router.put("/profile/:id", updateCustomerProfile);



module.exports = router;
