const OperationEvent = require('../models/OperationEvent');

// CREATE - Log watering/fertilization events
exports.logOperationEvent = async (req, res) => {
  try {
    const newEvent = new OperationEvent(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// CREATE - Log manual override actions
exports.logManualOverride = async (req, res) => {
  try {
    const overrideEvent = new OperationEvent({
      ...req.body,
      type: 'manual_override'
    });
    
    const savedEvent = await overrideEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ - Get all operation events
exports.getAllOperationEvents = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, location, startDate, endDate } = req.query;
    
    let filter = {};
    if (type) filter.type = type;
    if (location) filter.location = location;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const events = await OperationEvent.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await OperationEvent.countDocuments(filter);
    
    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};