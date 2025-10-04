// backend/services/tasksHR/employees.service.js
const { EmployeeProfile } = require("../../Model/tasksHR");

function buildEmployeeFilters(q = {}) {
  const f = {};
  if (q.department) f.department = q.department;
  if (q.designation) f.designation = q.designation;
  if (q.status) f.currentStatus = q.status; // if you add this field later
  if (q.search) {
    f.$or = [
      { fullName: new RegExp(q.search, "i") },
      { email: new RegExp(q.search, "i") },
      { department: new RegExp(q.search, "i") },
      { designation: new RegExp(q.search, "i") },
    ];
  }
  return f;
}

module.exports = {
  async list(q = {}) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = buildEmployeeFilters(q);
    const [rows, total] = await Promise.all([
      EmployeeProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeProfile.countDocuments(filter),
    ]);

    return { rows, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  },

  async create(data) {
    // TODO: validate fields & ensure data.userId refers to an existing User
    const doc = await EmployeeProfile.create(data);
    return doc.toObject();
  },

  async get(id) {
    return EmployeeProfile.findById(id).lean();
  },

  async update(id, patch) {
    const before = await EmployeeProfile.findById(id).lean();
    if (!before) return { before: null, after: null };
    const after = await EmployeeProfile.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();
    return { before, after };
  },

  async softDelete(id) {
    // If you later add a "deletedAt" or "currentStatus" field, switch to soft delete.
    await EmployeeProfile.findByIdAndDelete(id);
    return { ok: true };
  },
};
