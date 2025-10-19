// backend/Model/qualityControl/qualityControlmodel.js
const mongoose = require("mongoose");

/* -------------------- Grade subdocument -------------------- */
const GradeSchema = new mongoose.Schema(
  {
    system:    { type: String, default: null },           // system grade (A/B/C…)
    human:     { type: String, default: null },           // farmer/admin manual grade
    final:     { type: String, default: null },           // result after policy/weights
    policy:    { type: String, default: "system_only", trim: true },
    weights: {
      system:  { type: Number, default: 1, min: 0 },
      human:   { type: Number, default: 0, min: 0 },
    },
    decidedBy: { type: String, default: "system", trim: true },
    note:      { type: String, default: "", trim: true },
  },
  { _id: false }
);

/* -------------------- Main Quality schema -------------------- */
const QualitySchema = new mongoose.Schema(
  {
    owner:   { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    batchId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    // keep lowercase so rules/presets match reliably
    productName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    variety:   { type: String, required: true, trim: true },

    // Common attributes
    size:      { type: String, trim: true },
    color:     { type: String, trim: true },     // UI sends lowercase; grader lowercases anyway

    // 🔥 These drive the tomato rule; add them to persist & grade correctly
    firmness:  { type: String, trim: true },
    cracks:    { type: String, trim: true },
    blemishes: { type: String, trim: true },

    // Numeric fields
    freshness: {
      type: Number,
      min: 0,
      max: 100,
      set: (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
    },

    weight: {
      type: Number,
      min: 0,
      set: (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
    },

    notes:    { type: String, trim: true },

    // Any extra dynamic QC inputs
    readings: { type: Object, default: {} },

    grade:    { type: GradeSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

/* -------------------- Virtuals / clean output -------------------- */
QualitySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

QualitySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = QualitySchema;