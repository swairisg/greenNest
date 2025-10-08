const AlertConfig = require('../../Model/climateCheck/AlertConfigModel');
const AlertHistory = require('../../Model/climateCheck/AlertHistoryModel');
const climateAlertService = require('../../utils/climateAlertService');

const createAlertConfig = async (req, res) => {
  try {
    console.log('Creating alert config with data:', req.body);
    
    const alertConfig = new AlertConfig(req.body);
    await alertConfig.save();

    return res.status(201).json({
      success: true,
      message: 'Alert configuration created successfully',
      alertConfig
    });

  } catch (error) {
    console.error(' Error creating alert config:', error);
    return res.status(500).json({
      message: 'Failed to create alert configuration',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getAllAlertConfigs = async (req, res) => {
  try {
    console.log('Fetching all alert configs');
    const alertConfigs = await AlertConfig.find().sort({ parameter: 1 });
    console.log(`Found ${alertConfigs.length} alert configs`);
    
    return res.status(200).json({ alertConfigs });
  
  } catch (error) {
    console.error('Error fetching alert configs:', error);
    return res.status(500).json({ 
      message: 'Server Error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getAlertHistory = async (req, res) => {
  try {
    console.log('Fetching alert history with query:', req.query);
    
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

    console.log(`Found ${alerts.length} alert history records`);
    
    return res.status(200).json({ alerts });
  } catch (error) {
    console.error('❌ Error fetching alert history:', error);
    return res.status(500).json({ 
      message: 'Server Error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const updateAlertConfig = async (req, res) => {
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

const deleteAlertConfig = async (req, res) => {
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

const resolveAlert = async (req, res) => {
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

const getAlertSummary = async (req, res) => {
  try {
    const activeAlerts = await AlertConfig.countDocuments({ isActive: true });
    const recentAlerts = await AlertHistory.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const unresolvedAlerts = await AlertHistory.countDocuments({ isResolved: false });

    return res.status(200).json({
      summary: {
        activeAlerts,
        recentAlerts24h: recentAlerts,
        unresolvedAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const testAlertTrigger = async (req, res) => {
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

    let triggeredCount = 0;
    
    if (climateAlertService && typeof climateAlertService.checkClimateAlerts === 'function') {
      triggeredCount = await climateAlertService.checkClimateAlerts(testData);
    } else {
      console.warn('climateAlertService.checkClimateAlerts not available');

      const AlertHistory = require('../../Model/climateCheck/AlertHistoryModel');
      const testAlert = new AlertHistory({
        alertConfigId: new require('mongoose').Types.ObjectId(),
        parameter: parameter,
        recordedValue: value,
        thresholdType: value < 30 ? 'min' : 'max',
        thresholdValue: 30,
        severity: 'medium',
        message: `Test alert for ${parameter}: ${value}`,
        notificationMethods: ['in_app']
      });
      await testAlert.save();
      triggeredCount = 1;
    }

    return res.status(200).json({
      success: true,
      message: `Test completed. ${triggeredCount} alerts triggered.`,
      testData
    });
  } catch (error) {
    console.error('Error testing alert:', error);
    return res.status(500).json({ 
      message: 'Server Error',
      error: error.message 
    });
  }
};
/////////////////////////
exports.createAlertConfig = createAlertConfig;
exports.getAllAlertConfigs =getAllAlertConfigs;
exports.updateAlertConfig = updateAlertConfig;
exports.deleteAlertConfig = deleteAlertConfig;
exports.getAlertHistory =getAlertHistory;
exports.resolveAlert = resolveAlert;
exports.getAlertSummary =getAlertSummary;
exports.testAlertTrigger = testAlertTrigger;
