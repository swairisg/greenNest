const express = require('express');
const router = express.Router();

const climateRoutes = require('../routes/ClimateRoutes');
const operationRoutes = require('../routes/operationRoutes');
const automationRoutes = require('../routes/automationRoutes');

router.use('/api/climate', climateRoutes);
router.use('/api/operations', operationRoutes);
router.use('/api/automation', automationRoutes);

module.exports = router;