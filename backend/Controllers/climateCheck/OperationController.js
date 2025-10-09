const Operation = require("../../Model/climateCheck/OperationEvent"); // Mongoose model for events/logs

// Create a new operation/event
const addEvent = async (req, res) => {
  try {
    const { type, status, performedBy } = req.body; // type: watering/fertilization/manualOverride
    const newEvent = new Operation({ type, status, performedBy });
    const saved = await newEvent.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all events
const getEvents = async (req, res) => {
  try {
    const events = await Operation.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update event/operation status
const updateEvent = async (req, res) => {
  try {
    const updated = await Operation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete old events/logs
const deleteOldEvents = async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (req.query.days || 30));
    const result = await Operation.deleteMany({ createdAt: { $lt: cutoff } });
    res.status(200).json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Delete a specific event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete event request for ID:', id); // Debug log
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Event ID is required" 
      });
    }

    const deleted = await Operation.findByIdAndDelete(id);
    console.log('Delete operation result:', deleted); // Debug log
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Event deleted successfully",
      data: deleted 
    });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting event",
      error: err.message 
    });
  }
};

module.exports = {
  addEvent,
  getEvents,
  updateEvent,
  deleteOldEvents,
  deleteEvent 
};
