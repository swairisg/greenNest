const mongoose = require("mongoose");

const VisitBookingSchema = new mongoose.Schema(
  {
    fullName: 
    { type: String,
      required: true, 
      trim: true, minlength: 2, 
      maxlength: 80 
    },
    email:
    { type: String,
      required: true,
      trim: true, lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"] 
    },
    phone: 
    { type: String, 
      required: true,
      trim: true,
      maxlength: 20 
    },
    preferredDate:
    { type: Date,
      required: true
    },
    timeSlot: 
    { type: String, 
      required: true,
      enum: ["09:00-10:00","10:00-11:00","11:00-12:00","13:00-14:00","14:00-15:00","15:00-16:00"] 
    },
    visitorsCount:
    { type: Number,
      required: true, 
      min: 1,
      max: 20 
    },
    purpose: 
    { type: String, 
      trim: true, 
      maxlength: 300
    },
    agreeToTerms: 
    { type: Boolean, 
      required: true 
    },
    // anti-spam honeypot (should be empty)
    website: { type: String, default: "" },
    status:  { type: String, enum: ["pending","confirmed","rejected"], default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisitBooking", VisitBookingSchema);
