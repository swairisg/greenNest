const mongoose = require('mongoose');

const operationEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['watering', 'fertilization', 'manual_override'],
    required: true,
  },
  description: String,
  amount: Number, // for watering/fertilization amounts
  duration: Number, // in minutes
  staffId: String,
  automated: {
    type: Boolean,
    default: false,
  },
  location: String,
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OperationEvent', operationEventSchema);