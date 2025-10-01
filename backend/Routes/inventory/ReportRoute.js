const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/InventoryAndSupplychain/reportController');

// Stock reports
router.get('/stock', reportController.generateStockReport);
router.get('/export/csv', reportController.exportToCSV);
router.get('/dashboard/stats', reportController.getDashboardStats);

module.exports = router;