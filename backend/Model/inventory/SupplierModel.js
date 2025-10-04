const mongoose = require("mongoose"); //for transactions
//const { inventoryConnection } = require('../../config/database');

const SupplierSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    contactPerson: String,
    email: String,
    phone: String,
    address: String,
    taxId: String,
    paymentTerms: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", SupplierSchema);
