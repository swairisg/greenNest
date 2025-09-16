const AutomationSettings = require('../models/AutomationSettings');

// CREATE/UPDATE - Modify automation thresholds
exports.updateAutomationSettings = async (req, res) => {
  try {
    const { location } = req.params;
    
    const settings = await AutomationSettings.findOneAndUpdate(
      { location },
      req.body,
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ - Get automation settings
exports.getAutomationSettings = async (req, res) => {
  try {
    const { location } = req.params;
    
    const settings = await AutomationSettings.findOne({ location });
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found for this location' });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Toggle watering status
exports.toggleWateringStatus = async (req, res) => {
  try {
    const { location } = req.params;
    const { wateringEnabled } = req.body;

    const settings = await AutomationSettings.findOneAndUpdate(
      { location },
      { wateringEnabled },
      { new: true }
    );

    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE - Set manual override
exports.setManualOverride = async (req, res) => {
  try {
    const { location } = req.params;
    const { active, reason, staffId, overrideUntil } = req.body;

    const settings = await AutomationSettings.findOneAndUpdate(
      { location },
      {
        manualOverride: {
          active,
          reason,
          staffId,
          overrideUntil
        }
      },
      { new: true }
    );

    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE - Clear old automation schedules
exports.clearOldSchedules = async (req, res) => {
  try {
    const result = await AutomationSettings.updateMany(
      { 'manualOverride.overrideUntil': { $lt: new Date() } },
      { 
        $set: { 
          'manualOverride.active': false,
          'manualOverride.reason': '',
          'manualOverride.staffId': '',
          'manualOverride.overrideUntil': null
        }
      }
    );

    res.json({ 
      message: `Cleared ${result.modifiedCount} expired override schedules`,
      clearedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};