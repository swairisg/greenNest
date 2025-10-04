// backend/services/tasksHR/tasks.service.js
const { TaskHR } = require("../../Model/tasksHR");

function buildTaskFilters(q = {}) {
  const f = {};
  if (q.assigneeId) f.assigneeId = q.assigneeId;
  if (q.status) f.status = q.status;
  if (q.priority) f.priority = q.priority;
  if (q.category) f.category = q.category;
  if (q.dueBefore || q.dueAfter) {
    f.dueDate = {};
    if (q.dueAfter) f.dueDate.$gte = new Date(q.dueAfter);
    if (q.dueBefore) f.dueDate.$lte = new Date(q.dueBefore);
  }
  if (q.search) {
    f.$or = [
      { title: new RegExp(q.search, "i") },
      { description: new RegExp(q.search, "i") },
    ];
  }
  return f;
}

module.exports = {
  async list(q = {}) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = buildTaskFilters(q);
    const [rows, total] = await Promise.all([
      TaskHR.find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TaskHR.countDocuments(filter),
    ]);

    return { rows, page, limit, total, pages: Math.ceil(total / limit) || 1 };
  },

  async create(data) {
    // TODO: validate enums (status, priority) and ensure assigneeId exists in EmployeeProfile
    const doc = await TaskHR.create({
      ...data,
      status: data.status || "todo",
    });
    return doc.toObject();
  },

  async get(id) {
    return TaskHR.findById(id).lean();
  },

  async update(id, patch) {
    const before = await TaskHR.findById(id).lean();
    if (!before) return { before: null, after: null };
    // TODO: enforce allowed status transitions & reassign rules
    const after = await TaskHR.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();
    return { before, after };
  },

  async comment(id, note) {
    await TaskHR.findByIdAndUpdate(
      id,
      { $push: { comments: { ...note, at: new Date() } } },
      { new: false }
    );
    return { ok: true };
  },
};
