const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');

// CREATE/UPDATE routes
router.put('/settings/:location', automationController.updateAutomationSettings);
router.patch('/settings/:location/watering', automationController.toggleWateringStatus);
router.patch('/settings/:location/override', automationController.setManualOverride);

// READ routes
router.get('/settings/:location', automationController.getAutomationSettings);

// DELETE routes
router.delete('/schedules/cleanup', automationController.clearOldSchedules);

module.exports = router;