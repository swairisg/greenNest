const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true }, // e.g., "employee.create"
    entityType: { type: String, required: true }, // "employee" | "task" | ...
    entityId: { type: String, required: true, index: true },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);
module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", schema);
