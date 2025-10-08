const mongoose = require("mongoose");
const { Schema } = mongoose;

const harvestScheduleSchema = new Schema(
  {
    cropType: {
      type: String,
      required: [true, "Crop type is required"],
    },

    greenhouseSection: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Normalize to UTC midnight and forbid future dates
    plantedDate: {
      type: Date,
      required: true,
      set: (v) => {
        if (!v) return v;

        // If we get "YYYY-MM-DD", build a UTC date from the parts (no TZ drift)
        if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const [y, m, d] = v.split("-").map(Number);
          return new Date(Date.UTC(y, m - 1, d)); // UTC midnight
        }

        // Otherwise parse and coerce to UTC midnight using local Y/M/D fields
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return v;
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      },
      validate: {
        validator(value) {
          if (!value) return false;
          // today at UTC midnight
          const todayUTC = new Date();
          todayUTC.setUTCHours(0, 0, 0, 0);
          return value.getTime() <= todayUTC.getTime();
        },
        message: "Planted date cannot be in the future.",
      },
      index: true,
    },

    status: {
      type: String,
      enum: ["planted", "upcoming", "over-due", "due-soon", "harvested"],
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
