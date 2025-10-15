const express = require('express');
const router = express.Router();

const climateRoutes = require('./ClimateRoutes');
const operationRoutes = require('./operationRoutes');
const automationRoutes = require('./automationRoutes');

router.use('/api/climate', climateRoutes);
router.use('/api/operations', operationRoutes);
router.use('/api/automation', automationRoutes);

module.exports = router;