const express = require("express");
const router = express.Router();
const invoiceCtrl = require("../../Controllers/finance/invoiceController");

// Create invoice from order
router.post("/", invoiceCtrl.createInvoice);

// Get all invoices
router.get("/", invoiceCtrl.getAllInvoices);

// Get invoice by ID
router.get("/:id", invoiceCtrl.getInvoiceById);

// Delete invoice
router.delete("/:id", invoiceCtrl.deleteInvoice);

module.exports = router;