const AlertConfig = require('../../Model/climateCheck/AlertConfigModel');
const AlertHistory = require('../../Model/climateCheck/AlertHistoryModel');
const climateAlertService = require('../../utils/climateAlertService');

// Create or update alert configuration
const createAlertConfig = async (req, res, next) => {
  try {
    const alertConfig = new AlertConfig(req.body);
    await alertConfig.save();

    return res.status(201).json({
      success: true,
      message: 'Alert configuration created successfully',
      alertConfig
    });
  } catch (error) {
    console.error('Error creating alert config:', error);
    return res.status(500).json({
      message: 'Failed to create alert configuration',
      error: error.message
    });
  }
};

// Get all alert configurations
const getAllAlertConfigs = async (req, res, next) => {
  try {
    const alertConfigs = await AlertConfig.find().sort({ parameter: 1 });

    return res.status(200).json({ alertConfigs });
  } catch (error) {
    console.error('Error fetching alert configs:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Update alert configuration
const updateAlertConfig = async (req, res, next) => {
  try {
    const alertConfig = await AlertConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!alertConfig) {
      return res.status(404).json({ message: 'Alert configuration not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Alert configuration updated successfully',
      alertConfig
    });
  } catch (error) {
    console.error('Error updating alert config:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Delete alert configuration
const deleteAlertConfig = async (req, res, next) => {
  try {
    const alertConfig = await AlertConfig.findByIdAndDelete(req.params.id);

    if (!alertConfig) {
      return res.status(404).json({ message: 'Alert configuration not found' });
    }

    return res.status(200).json({
      message: 'Alert configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert config:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Get alert history
const getAlertHistory = async (req, res, next) => {
  try {
    const { parameter, resolved, days = 7 } = req.query;
    
    let filter = {};
    if (parameter) filter.parameter = parameter;
    if (resolved !== undefined) filter.isResolved = resolved === 'true';
    
    if (days) {
      filter.createdAt = {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      };
    }

    const alerts = await AlertHistory.find(filter)
      .populate('alertConfigId')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Mark alert as resolved
const resolveAlert = async (req, res, next) => {
  try {
    const alert = await AlertHistory.findByIdAndUpdate(
      req.params.id,
      { 
        isResolved: true,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Alert marked as resolved',
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Get alert summary
const getAlertSummary = async (req, res, next) => {
  try {
    const summary = await climateAlertService.getAlertSummary();
    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Test alert trigger
const testAlertTrigger = async (req, res, next) => {
  try {
    const { parameter, value } = req.body;
    
    const testData = {
      [parameter]: value,
      temperature: 25,
      humidity: 60,
      soilMoisture: 45,
      location: 'Test Greenhouse',
      timestamp: new Date()
    };

    const triggeredCount = await climateAlertService.checkClimateAlerts(testData);

    return res.status(200).json({
      success: true,
      message: `Test completed. ${triggeredCount} alerts triggered.`,
      testData
    });
  } catch (error) {
    console.error('Error testing alert:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.createAlertConfig = createAlertConfig;
exports.getAllAlertConfigs = getAllAlertConfigs;
exports.updateAlertConfig = updateAlertConfig;
exports.deleteAlertConfig = deleteAlertConfig;
exports.getAlertHistory = getAlertHistory;
exports.resolveAlert = resolveAlert;
exports.getAlertSummary = getAlertSummary;
exports.testAlertTrigger = testAlertTrigger;