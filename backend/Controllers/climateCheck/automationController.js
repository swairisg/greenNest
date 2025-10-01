const Automation = require("../../models/ClimateMonitoring/AutomationSettings");

// Create a new automation threshold
const addThreshold = async (req, res) => {
  try {
    const { parameter, minValue, maxValue } = req.body;
    const newThreshold = new Automation({ parameter, minValue, maxValue });
    const saved = await newThreshold.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all thresholds
const getThresholds = async (req, res) => {
  try {
    const thresholds = await Automation.find();
    res.status(200).json({ success: true, data: thresholds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a threshold
const updateThreshold = async (req, res) => {
  try {
    const { minValue, maxValue, isActive } = req.body;
    const updated = await Automation.findByIdAndUpdate(
      req.params.id,
      { 
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Threshold not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a threshold
const deleteThreshold = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete request received for ID:', id);
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "ID is required" 
      });
    }

    const deleted = await Automation.findByIdAndDelete(id);
    console.log('Delete operation result:', deleted); 
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: "Threshold not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Threshold deleted successfully",
      data: deleted 
    });
  } catch (err) {
    console.error('Delete error details:', err); //detailed error log
    res.status(500).json({ 
      success: false, 
      message: "Error deleting threshold",
      error: err.message 
    });
  }
};

module.exports = {
  addThreshold,
  getThresholds,
  updateThreshold,
  deleteThreshold
};
