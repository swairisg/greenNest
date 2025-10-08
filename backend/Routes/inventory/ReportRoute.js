const express = require('express');
const router = express.Router();
const reportController = require('../../Controllers/inventory/reportController');

// Stock reports
router.get('/stock', reportController.generateStockReport.bind(reportController));
router.get('/export/csv', reportController.exportToCSV.bind(reportController));
router.get('/dashboard/stats', reportController.getDashboardStats.bind(reportController));

module.exports = router;