const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const harvestScheduleSchema = new Schema(
  {
    cropType: {
        type: String,
        required: [true, 'Crop type is required'],
    },

    greenhouseSection: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    //validation for plantedDate to not allow future dates
    plantedDate: {
      type: Date,
      required: true,
      set: (v) => {
      if (!v) return v;
      const d = new Date(v);
      d.setHours(0,0,0,0);
      return d;
    },
    validate: {
      validator: function(value) {
        if (!value) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        return value <= today;
    },
    message: "Planted date cannot be in the future."
  }
},
    
    status: {
      type: String,
      enum: ["planted", "upcoming","over-due","due-soon", "harvested"],
      default: "planted",
      index: true,
    },    
    
    
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("HarvestSchedule", harvestScheduleSchema);
