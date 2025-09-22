// controllers/automationController.js
const { AutomationSettings, AutomationLog, AutomationSchedule } = require('../models/AutomationSettings');
const ClimateRecord = require('../models/ClimateRecord');

// ============ AUTOMATION SETTINGS CRUD ============

// Get current automation settings
const getAutomationSettings = async (req, res) => {
  try {
    const { greenhouse = 'main' } = req.query;
    
    let settings = await AutomationSettings.findOne({ greenhouse });
    
    // Create default settings if none exist
    if (!settings) {
      settings = new AutomationSettings({ greenhouse });
      await settings.save();
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation settings',
      error: error.message
    });
  }
};

// Update automation thresholds
const updateThresholds = async (req, res) => {
  try {
    const { greenhouse = 'main' } = req.query;
    const { thresholds, updatedBy = 'system' } = req.body;
    
    const settings = await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      { 
        thresholds,
        updatedBy,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    // Log the threshold change
    await new AutomationLog({
      eventType: 'threshold_change',
      action: 'modified',
      trigger: 'manual',
      details: {
        previousValue: settings.thresholds,
        newValue: thresholds
      },
      staff: { name: updatedBy },
      greenhouse,
      success: true
    }).save();
    
    res.status(200).json({
      success: true,
      message: 'Thresholds updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds',
      error: error.message
    });
  }
};

// Update operation status (ON/OFF/AUTO)
const updateOperationStatus = async (req, res) => {
  try {
    const { operation } = req.params; // watering, fertilization, ventilation
    const { status, updatedBy = 'system', reason = '' } = req.body;
    const { greenhouse = 'main' } = req.query;
    
    const validOperations = ['watering', 'fertilization', 'ventilation'];
    const validStatuses = ['ON', 'OFF', 'AUTO'];
    
    if (!validOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`
      });
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const updatePath = `operations.${operation}.status`;
    const settings = await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      { 
        [updatePath]: status,
        [`operations.${operation}.manualOverride`]: status !== 'AUTO',
        updatedBy,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    // Log the status change
    await new AutomationLog({
      eventType: operation,
      action: status === 'ON' ? 'enabled' : status === 'OFF' ? 'disabled' : 'modified',
      trigger: 'manual',
      details: {
        newValue: status
      },
      staff: { 
        name: updatedBy,
        reason: reason
      },
      greenhouse,
      success: true
    }).save();
    
    res.status(200).json({
      success: true,
      message: `${operation} status updated to ${status}`,
      data: settings.operations[operation]
    });
  } catch (error) {
    console.error('Error updating operation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update operation status',
      error: error.message
    });
  }
};

// ============ MANUAL OVERRIDE ============

// Activate manual override
const activateManualOverride = async (req, res) => {
  try {
    const { 
      activatedBy, 
      reason, 
      duration = 60, // Duration in minutes
      operations = [] // Array of operations to override
    } = req.body;
    const { greenhouse = 'main' } = req.query;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    
    const settings = await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      {
        manualOverride: {
          isActive: true,
          activatedBy,
          reason,
          activatedAt: new Date(),
          expiresAt
        },
        updatedBy: activatedBy,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    // Update specified operations to manual override
    if (operations.length > 0) {
      for (const operation of operations) {
        await AutomationSettings.findOneAndUpdate(
          { greenhouse },
          { [`operations.${operation}.manualOverride`]: true }
        );
      }
    }
    
    // Log the manual override activation
    await new AutomationLog({
      eventType: 'manual_override',
      action: 'started',
      trigger: 'manual',
      details: {
        duration,
        operations
      },
      staff: {
        name: activatedBy,
        reason
      },
      greenhouse,
      success: true
    }).save();
    
    res.status(200).json({
      success: true,
      message: 'Manual override activated',
      data: settings.manualOverride
    });
  } catch (error) {
    console.error('Error activating manual override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate manual override',
      error: error.message
    });
  }
};

// Deactivate manual override
const deactivateManualOverride = async (req, res) => {
  try {
    const { deactivatedBy = 'system', reason = 'Manual deactivation' } = req.body;
    const { greenhouse = 'main' } = req.query;
    
    await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      {
        'manualOverride.isActive': false,
        'operations.watering.manualOverride': false,
        'operations.fertilization.manualOverride': false,
        'operations.ventilation.manualOverride': false,
        updatedBy: deactivatedBy,
        updatedAt: new Date()
      }
    );
    
    // Log the manual override deactivation
    await new AutomationLog({
      eventType: 'manual_override',
      action: 'stopped',
      trigger: 'manual',
      staff: {
        name: deactivatedBy,
        reason
      },
      greenhouse,
      success: true
    }).save();
    
    res.status(200).json({
      success: true,
      message: 'Manual override deactivated'
    });
  } catch (error) {
    console.error('Error deactivating manual override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate manual override',
      error: error.message
    });
  }
};

// ============ AUTOMATION EXECUTION ============

// Execute watering operation
const executeWatering = async (req, res) => {
  try {
    const { 
      duration = 10, 
      trigger = 'manual', 
      staffName = 'system',
      reason = ''
    } = req.body;
    const { greenhouse = 'main' } = req.query;
    
    // Get current climate data
    const latestClimate = await ClimateRecord.findOne({ location: greenhouse })
      .sort({ timestamp: -1 });
    
    if (!latestClimate) {
      return res.status(404).json({
        success: false,
        message: 'No climate data available for decision making'
      });
    }
    
    // Log watering start
    const logEntry = await new AutomationLog({
      eventType: 'watering',
      action: 'started',
      trigger,
      details: {
        duration,
        sensorData: {
          temperature: latestClimate.temperature,
          humidity: latestClimate.humidity,
          soilMoisture: latestClimate.soilMoisture
        }
      },
      staff: {
        name: staffName,
        reason
      },
      greenhouse,
      success: true
    }).save();
    
    // Update last run time
    await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      { 'operations.watering.lastRun': new Date() }
    );
    
    // Simulate watering operation (in real system, this would control hardware)
    console.log(`🚰 Starting watering for ${duration} minutes in ${greenhouse}`);
    
    // In a real system, you would:
    // 1. Send signal to watering system hardware
    // 2. Monitor the operation
    // 3. Handle any errors
    // 4. Log completion
    
    // Simulate completion after duration (simplified for demo)
    setTimeout(async () => {
      try {
        await AutomationLog.findByIdAndUpdate(logEntry._id, {
          action: 'completed',
          success: true
        });
        console.log(`✅ Watering completed in ${greenhouse}`);
      } catch (error) {
        console.error('Error updating watering log:', error);
      }
    }, duration * 1000); // Convert minutes to milliseconds for demo
    
    res.status(200).json({
      success: true,
      message: `Watering started for ${duration} minutes`,
      logId: logEntry._id
    });
  } catch (error) {
    console.error('Error executing watering:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute watering',
      error: error.message
    });
  }
};

// Execute fertilization operation
const executeFertilization = async (req, res) => {
  try {
    const { 
      type = 'general', 
      trigger = 'manual', 
      staffName = 'system',
      reason = ''
    } = req.body;
    const { greenhouse = 'main' } = req.query;
    
    // Log fertilization event
    const logEntry = await new AutomationLog({
      eventType: 'fertilization',
      action: 'started',
      trigger,
      details: {
        fertilizationType: type
      },
      staff: {
        name: staffName,
        reason
      },
      greenhouse,
      success: true
    }).save();
    
    // Update last run time
    await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      { 'operations.fertilization.lastRun': new Date() }
    );
    
    console.log(`🌱 Starting ${type} fertilization in ${greenhouse}`);
    
    // Mark as completed (in real system, this would be after actual operation)
    await AutomationLog.findByIdAndUpdate(logEntry._id, {
      action: 'completed',
      success: true
    });
    
    res.status(200).json({
      success: true,
      message: `${type} fertilization completed`,
      logId: logEntry._id
    });
  } catch (error) {
    console.error('Error executing fertilization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute fertilization',
      error: error.message
    });
  }
};

// ============ AUTOMATION SCHEDULES ============

// Get all schedules
const getSchedules = async (req, res) => {
  try {
    const { greenhouse = 'main' } = req.query;
    const schedules = await AutomationSchedule.find({ greenhouse })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
};

// Create new schedule
const createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    const schedule = new AutomationSchedule(scheduleData);
    await schedule.save();
    
    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
};

// Delete old schedules
const deleteOldSchedules = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await AutomationSchedule.deleteMany({
      enabled: false,
      createdAt: { $lt: cutoffDate }
    });
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old schedules`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting old schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old schedules',
      error: error.message
    });
  }
};

// ============ LOGS AND MONITORING ============

// Get automation logs
const getAutomationLogs = async (req, res) => {
  try {
    const { 
      greenhouse = 'main', 
      eventType, 
      limit = 50,
      startDate,
      endDate 
    } = req.query;
    
    const query = { greenhouse };
    
    if (eventType) query.eventType = eventType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await AutomationLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching automation logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation logs',
      error: error.message
    });
  }
};

// Get automation dashboard data
const getDashboardData = async (req, res) => {
  try {
    const { greenhouse = 'main' } = req.query;
    
    // Get current settings
    const settings = await AutomationSettings.findOne({ greenhouse });
    
    // Get recent logs
    const recentLogs = await AutomationLog.find({ greenhouse })
      .sort({ timestamp: -1 })
      .limit(10);
    
    // Get today's events count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = await AutomationLog.countDocuments({
      greenhouse,
      timestamp: { $gte: today }
    });
    
    // Get active schedules
    const activeSchedules = await AutomationSchedule.find({
      greenhouse,
      enabled: true
    }).countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        settings,
        recentLogs,
        stats: {
          todayEvents,
          activeSchedules,
          manualOverrideActive: settings?.manualOverride?.isActive || false
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  // Settings
  getAutomationSettings,
  updateThresholds,
  updateOperationStatus,
  
  // Manual Override
  activateManualOverride,
  deactivateManualOverride,
  
  // Operations
  executeWatering,
  executeFertilization,
  
  // Schedules
  getSchedules,
  createSchedule,
  deleteOldSchedules,
  
  // Logs and Monitoring
  getAutomationLogs,
  getDashboardData
};