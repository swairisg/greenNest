const AuditLog = require("../Model/audit/AuditLog");

async function writeAudit({
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
}) {
  try {
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      before,
      after,
    });
  } catch (e) {
    // don't crash main flow on audit failures
    console.error("Audit write failed:", e?.message);
  }
}

module.exports = { writeAudit };
