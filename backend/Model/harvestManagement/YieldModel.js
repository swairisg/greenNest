const mongoose = require('mongoose');

const yieldSchema = new mongoose.Schema({
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HarvestSchedule',
        required: true,
    },
    harvestdate: {
        type: Date,
        required: true,
        validate: {
      validator: function (v) {
        if (!v) return false;
        const d = new Date(v);
        d.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d <= today;
      },
      message: 'Harvest date cannot be in the future.'
    }
    },
    greenhouseSection: {
        type: String, // Assuming fieldNumber is a number, you can adjust the type if needed
        required: true, // If this field is required
    },
    cropType: {
        type: String,
        required: true,
    },
    PlantedDate: {
        type: Date,
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
    },
    treesPicked: {
        type: Number,
        required: true,
    },
    storageLocation: {
        type: String,
        required: true,
    },
    
});

module.exports = mongoose.model('YieldRecords', yieldSchema);
