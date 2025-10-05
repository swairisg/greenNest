const express = require("express");
const requireAuth = require("../../middleware/requireAuth");
const { ensureSelfOrAdmin } = require("../../middleware/roles");

const {
  getCustomerProfile,
  updateCustomerProfile,
} = require("../../Controllers/auth/customerProfile.controller");

const {
  getEmployeeProfile,
  updateEmployeeProfile,
} = require("../../Controllers/auth/employeeProfile.controller");

const router = express.Router();

// Customer
router.get(
  "/customer/profile/:id",
  requireAuth,
  ensureSelfOrAdmin,
  getCustomerProfile
);
router.put(
  "/customer/profile/:id",
  requireAuth,
  ensureSelfOrAdmin,
  updateCustomerProfile
);

// Employee
router.get(
  "/employee/profile/:id",
  requireAuth,
  ensureSelfOrAdmin,
  getEmployeeProfile
);
router.put(
  "/employee/profile/:id",
  requireAuth,
  ensureSelfOrAdmin,
  updateEmployeeProfile
);

module.exports = router;
