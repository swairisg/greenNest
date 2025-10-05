// backend/services/tasksHR/performance.service.js
const { Performance } = require("../../Model/tasksHR");

module.exports = {
  async list(q = {}) {
    const filter = {};
    if (q.employeeId) filter.employeeId = q.employeeId;
    if (q.period) filter.period = q.period;

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Performance.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Performance.countDocuments(filter),
    ]);

    return { rows, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  },

  async create(data) {
    // data: { employeeId, period, kpis[], ratings[], feedback[] }
    const doc = await Performance.create({ ...data, status: "draft" });
    return doc.toObject();
  },

  async get(id) {
    return Performance.findById(id).lean();
  },

  async update(id, patch) {
    const doc = await Performance.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();
    return doc;
  },

  async finalize(id) {
    await Performance.findByIdAndUpdate(id, {
      $set: { status: "finalized", finalizedAt: new Date() },
    });
    return { ok: true };
  },
};
