// routes/automationRoutes.js
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/automationController');

// ============ AUTOMATION SETTINGS ROUTES ============

// GET /api/automation/settings - Get current automation settings
router.get('/settings', getAutomationSettings);

// PUT /api/automation/thresholds - Update automation thresholds
router.put('/thresholds', updateThresholds);

// PUT /api/automation/operations/:operation/status - Update operation status (ON/OFF/AUTO)
// :operation can be 'watering', 'fertilization', or 'ventilation'
router.put('/operations/:operation/status', updateOperationStatus);

// ============ MANUAL OVERRIDE ROUTES ============

// POST /api/automation/override/activate - Activate manual override
router.post('/override/activate', activateManualOverride);

// POST /api/automation/override/deactivate - Deactivate manual override
router.post('/override/deactivate', deactivateManualOverride);

// ============ OPERATION EXECUTION ROUTES ============

// POST /api/automation/operations/watering - Execute watering operation
router.post('/operations/watering', executeWatering);

// POST /api/automation/operations/fertilization - Execute fertilization operation
router.post('/operations/fertilization', executeFertilization);

// ============ SCHEDULE MANAGEMENT ROUTES ============

// GET /api/automation/schedules - Get all automation schedules
router.get('/schedules', getSchedules);

// POST /api/automation/schedules - Create new automation schedule
router.post('/schedules', createSchedule);

// PUT /api/automation/schedules/:id - Update existing schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const { AutomationSchedule } = require('../models/AutomationSettings');
    const schedule = await AutomationSchedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
});

// DELETE /api/automation/schedules/:id - Delete specific schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { AutomationSchedule } = require('../models/AutomationSettings');
    const schedule = await AutomationSchedule.findByIdAndDelete(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
});

// DELETE /api/automation/schedules/cleanup - Delete old/disabled schedules
router.delete('/schedules/cleanup', deleteOldSchedules);

// ============ LOGGING AND MONITORING ROUTES ============

// GET /api/automation/logs - Get automation logs
router.get('/logs', getAutomationLogs);

// GET /api/automation/dashboard - Get dashboard data
router.get('/dashboard', getDashboardData);

// DELETE /api/automation/logs/cleanup - Clean up old logs
router.delete('/logs/cleanup', async (req, res) => {
  try {
    const { daysOld = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { AutomationLog } = require('../models/AutomationSettings');
    const result = await AutomationLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old log entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up logs',
      error: error.message
    });
  }
});

// ============ SYSTEM STATUS ROUTES ============

// GET /api/automation/status - Get current system status
router.get('/status', async (req, res) => {
  try {
    const { greenhouse = 'main' } = req.query;
    
    const { AutomationSettings, AutomationLog } = require('../models/AutomationSettings');
    
    // Get current settings
    const settings = await AutomationSettings.findOne({ greenhouse });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'No automation settings found for this greenhouse'
      });
    }
    
    // Get last activity for each operation
    const lastWatering = await AutomationLog.findOne({
      greenhouse,
      eventType: 'watering',
      action: { $in: ['started', 'completed'] }
    }).sort({ timestamp: -1 });
    
    const lastFertilization = await AutomationLog.findOne({
      greenhouse,
      eventType: 'fertilization',
      action: { $in: ['started', 'completed'] }
    }).sort({ timestamp: -1 });
    
    // Check if any operations are currently running
    const runningOperations = await AutomationLog.find({
      greenhouse,
      action: 'started',
      timestamp: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    });
    
    // Find matching completed operations
    const completedOperations = await AutomationLog.find({
      greenhouse,
      action: { $in: ['completed', 'failed'] },
      timestamp: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });
    
    // Determine which operations are still running
    const currentlyRunning = runningOperations.filter(running => {
      return !completedOperations.some(completed => 
        completed.eventType === running.eventType &&
        completed.timestamp > running.timestamp
      );
    });
    
    const status = {
      settings: {
        thresholds: settings.thresholds,
        operations: settings.operations,
        manualOverride: settings.manualOverride
      },
      lastActivity: {
        watering: lastWatering?.timestamp || null,
        fertilization: lastFertilization?.timestamp || null
      },
      currentlyRunning: currentlyRunning.map(op => ({
        operation: op.eventType,
        startedAt: op.timestamp,
        duration: op.details?.duration || null
      })),
      systemHealth: {
        operational: true,
        lastUpdate: settings.updatedAt,
        manualOverrideActive: settings.manualOverride?.isActive || false
      }
    };
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status',
      error: error.message
    });
  }
});

// ============ EMERGENCY ROUTES ============

// POST /api/automation/emergency/stop - Emergency stop all operations
router.post('/emergency/stop', async (req, res) => {
  try {
    const { stoppedBy = 'emergency', reason = 'Emergency stop activated' } = req.body;
    const { greenhouse = 'main' } = req.query;
    
    const { AutomationSettings, AutomationLog } = require('../models/AutomationSettings');
    
    // Stop all operations
    await AutomationSettings.findOneAndUpdate(
      { greenhouse },
      {
        'operations.watering.status': 'OFF',
        'operations.fertilization.status': 'OFF',
        'operations.ventilation.status': 'OFF',
        'operations.watering.manualOverride': true,
        'operations.fertilization.manualOverride': true,
        'operations.ventilation.manualOverride': true,
        'manualOverride.isActive': true,
        'manualOverride.activatedBy': stoppedBy,
        'manualOverride.reason': reason,
        'manualOverride.activatedAt': new Date(),
        updatedBy: stoppedBy
      },
      { upsert: true }
    );
    
    // Log the emergency stop
    await new AutomationLog({
      eventType: 'manual_override',
      action: 'started',
      trigger: 'emergency',
      details: {
        emergencyStop: true,
        allOperations: ['watering', 'fertilization', 'ventilation']
      },
      staff: {
        name: stoppedBy,
        reason
      },
      greenhouse,
      success: true
    }).save();
    
    res.status(200).json({
      success: true,
      message: 'Emergency stop activated - all operations stopped'
    });
  } catch (error) {
    console.error('Error during emergency stop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute emergency stop',
      error: error.message
    });
  }
});

// ============ TESTING AND UTILITIES ============

// GET /api/automation/test - Test route to verify automation system
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "Automation API is working!",
    endpoints: {
      settings: "GET /api/automation/settings",
      thresholds: "PUT /api/automation/thresholds",
      operations: "PUT /api/automation/operations/:operation/status",
      override: "POST /api/automation/override/activate",
      watering: "POST /api/automation/operations/watering",
      fertilization: "POST /api/automation/operations/fertilization",
      schedules: "GET /api/automation/schedules",
      logs: "GET /api/automation/logs",
      dashboard: "GET /api/automation/dashboard",
      status: "GET /api/automation/status",
      emergency: "POST /api/automation/emergency/stop"
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;