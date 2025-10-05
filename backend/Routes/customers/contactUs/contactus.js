const express = require("express");
const router = express.Router();

const {
  getAllContacts,
  addContact,
  getById,
  updateContact,
  deleteContact,
  getContactStats
} = require("../../../Controllers/customers/contactUsController");

router.post("/contact-us", addContact);
router.get("/contact-us", getAllContacts);
router.get("/contact-us/stats", getContactStats);
router.get("/contact-us/:id", getById);
router.patch("/contact-us/:id", updateContact);
router.delete("/contact-us/:id", deleteContact);

module.exports = router;
