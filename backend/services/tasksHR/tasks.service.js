const mongoose = require("mongoose");
const Task = require("../../Model/tasksHR/Task");
const Employee = require("../../Model/tasksHR/EmployeeProfile");

const isObjId = (id) => mongoose.isValidObjectId(String(id || ""));

const bad = (msg, code = 400) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

/** Ensure assignee exists and is active (and not soft-deleted) */
async function assertActiveAssignee(assigneeId) {
  if (!assigneeId) return; // optional field
  if (!isObjId(assigneeId)) throw bad("assignee must be a valid ObjectId");
  const e = await Employee.findById(assigneeId).lean();
  if (!e || e.isDeleted) throw bad("Assignee not found or deleted", 404);
  if (e.currentStatus !== "active")
    throw bad("Cannot assign tasks to inactive/terminated employee");
}

/** CREATE */
async function create(body, actor) {
  if (!String(body.title || "").trim()) throw bad("title is required");
  await assertActiveAssignee(body.assignee);

  const doc = await Task.create({
    title: String(body.title).trim(),
    description: String(body.description || "").trim() || undefined,
    priority: body.priority || "normal",
    status: body.status || "open",
    dueDate: body.dueDate || undefined,
    assignee: body.assignee || undefined,
    creatorId: actor?._id || actor?.id, // controller passes req.user
  });
  return doc;
}

/** GET ONE */
async function get(id) {
  if (!isObjId(id)) return null;
  return Task.findOne({ _id: id, isDeleted: false })
    .populate({
      path: "assignee",
      select: "fullName department designation currentStatus",
    })
    .lean();
}

/** UPDATE (limited: title, description, priority, status, dueDate, assignee) */
async function update(id, patch) {
  if (!isObjId(id)) throw bad("invalid id");
  if (patch.assignee) await assertActiveAssignee(patch.assignee);

  const allowed = {};
  ["title", "description", "priority", "status", "dueDate", "assignee"].forEach(
    (k) => {
      if (patch[k] !== undefined) allowed[k] = patch[k];
    }
  );

  const before = await Task.findById(id).lean();
  if (!before || before.isDeleted) throw bad("Not found", 404);

  const after = await Task.findByIdAndUpdate(id, allowed, {
    new: true,
    runValidators: true,
  }).lean();

  return { before, after };
}

/** LIST with filters + pagination + search */
async function list(query = {}) {
  const {
    search = "",
    status,
    priority,
    assignee, // employee _id
    dueFrom,
    dueTo,
    page = 1,
    pageSize = 10,
  } = query;

  const q = { isDeleted: false };
  if (status) q.status = status;
  if (priority) q.priority = priority;
  if (assignee && isObjId(assignee)) q.assignee = assignee;

  // due range
  if (dueFrom || dueTo) {
    q.dueDate = {};
    if (dueFrom) q.dueDate.$gte = new Date(dueFrom);
    if (dueTo) q.dueDate.$lte = new Date(dueTo);
  }

  if (search) {
    if (search.length >= 3) q.$text = { $search: search };
    else q.title = { $regex: search, $options: "i" };
  }

  const ps = Math.max(1, Number(pageSize));
  const skip = (Math.max(1, Number(page)) - 1) * ps;

  const [rows, total] = await Promise.all([
    Task.find(q)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(ps)
      .populate({
        path: "assignee",
        select: "fullName department designation currentStatus",
      })
      .lean(),
    Task.countDocuments(q),
  ]);

  return { data: rows, total, page: Number(page), pageSize: ps };
}

/** COMMENT */
async function comment(id, { authorId, text }) {
  if (!isObjId(id)) throw bad("invalid id");
  if (!authorId || !isObjId(authorId)) throw bad("invalid authorId");
  if (!String(text || "").trim()) throw bad("comment text required");
  const upd = await Task.findByIdAndUpdate(
    id,
    { $push: { comments: { authorId, text: String(text).trim() } } },
    { new: true }
  ).lean();
  if (!upd) throw bad("Not found", 404);
  return upd;
}

module.exports = { create, get, update, list, comment };
