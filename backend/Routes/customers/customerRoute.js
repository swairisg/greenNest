// Routes/customers/customerRoute.js
const router = require("express").Router();
const {
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createCustomer, // remove if not needed
} = require("../../Controllers/customers/customerController");

// Mounted at /api/customers in app.js
router.get("/", listCustomers);
router.get("/:id", getCustomerById);
router.patch("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.post("/", createCustomer);

module.exports = router;
