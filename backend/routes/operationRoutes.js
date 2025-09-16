const express = require('express');
const router = express.Router();
const operationController = require('./controllers/operationController');

// CREATE routes
router.post('/events', operationController.logOperationEvent);
router.post('/manual-override', operationController.logManualOverride);

// READ routes
router.get('/events', operationController.getAllOperationEvents);

module.exports = router;