const express = require('express');
const router = express.Router();
const reportController = require('../../Controllers/inventory/reportController');

// Stock reports
router.get('/stock', reportController.generateStockReport);
router.get('/export/csv', reportController.exportToCSV);
router.get('/dashboard/stats', reportController.getDashboardStats);

module.exports = router;