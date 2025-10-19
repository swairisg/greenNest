// backend/Controllers/tasksHR/taskController.js
const mongoose = require("mongoose");
const Task = require("../../Model/tasksHR/Task");
const Employee = require("../../Model/tasksHR/EmployeeProfile");

const bad = (res, msg, code = 400) => res.status(code).json({ message: msg });

/* ---------- LIST: GET /hr/tasks ---------- */
exports.list = async (req, res) => {
  try {
    const {
      search = "",
      status,
      priority,
      assignee, // employeeId
      department, // optional department filter
      dueFrom,
      dueTo,
      page = 1,
      pageSize = 10,
    } = req.query;

    const q = { isDeleted: false };

    if (search) {
      if (String(search).length >= 3) q.$text = { $search: search };
      else q.title = { $regex: search, $options: "i" };
    }
    if (status && status !== "all") q.status = status;
    if (priority && priority !== "all") q.priority = priority;
    if (department && department !== "all") q.department = department;

    if (assignee && assignee !== "all" && mongoose.isValidObjectId(assignee)) {
      q.assignee = assignee;
    }

    if (dueFrom || dueTo) {
      q.dueDate = {};
      if (dueFrom) q.dueDate.$gte = new Date(dueFrom);
      if (dueTo) q.dueDate.$lte = new Date(dueTo);
    }

    const ps = Math.max(1, Number(pageSize));
    const skip = (Math.max(1, Number(page)) - 1) * ps;

    const [rows, total] = await Promise.all([
      Task.find(q)
        .populate("assignee", "fullName department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ps),
      Task.countDocuments(q),
    ]);

    res.json({ data: rows, total, page: Number(page), pageSize: ps });
  } catch (err) {
    console.error("Tasks list error:", err);
    bad(res, "Failed to fetch tasks", 500);
  }
};

/* ---------- CREATE: POST /hr/tasks ---------- */
exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = "normal",
      dueDate, // "YYYY-MM-DD" OK
      department, // fallback when no assignee selected
      assigneeId, // preferred
      assignee, // also accept "assignee" for compatibility
    } = req.body || {};

    if (!title || !String(title).trim()) return bad(res, "Title is required");
    if (!["low", "normal", "high"].includes(priority))
      return bad(res, "Invalid priority");

    // normalize assignee param
    const assigneeParam = assigneeId || assignee || null;

    let assigneeDoc = null;
    if (assigneeParam) {
      if (!mongoose.isValidObjectId(assigneeParam))
        return bad(res, "Invalid assignee id");
      assigneeDoc = await Employee.findById(assigneeParam).lean();
      if (!assigneeDoc) return bad(res, "Assignee not found", 404);
    }

    const doc = await Task.create({
      title: String(title).trim(),
      description: description?.trim(),
      priority,
      status: "open",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignee: assigneeDoc?._id || undefined,
      department: assigneeDoc?.department || department || undefined,
      createdBy: req.user?.id,
    });

    // Return with populated assignee for UI
    const populated = await Task.findById(doc._id).populate(
      "assignee",
      "fullName department"
    );

    res.status(201).json({ data: populated });
  } catch (err) {
    console.error("Task create error:", err);
    bad(res, "Failed to create task", 500);
  }
};

/* ---------- GET: /hr/tasks/:id ---------- */
exports.get = async (req, res) => {
  try {
    const row = await Task.findById(req.params.id).populate(
      "assignee",
      "fullName department"
    );
    if (!row || row.isDeleted) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    bad(res, "Not found", 404);
  }
};

/* ---------- UPDATE: PATCH /hr/tasks/:id ---------- */
exports.update = async (req, res) => {
  try {
    const patch = { ...req.body, updatedBy: req.user?.id };

    // enum guards
    if (patch.priority && !["low", "normal", "high"].includes(patch.priority))
      return bad(res, "Invalid priority");
    if (
      patch.status &&
      !["open", "in_progress", "blocked", "done"].includes(patch.status)
    )
      return bad(res, "Invalid status");

    // normalize assignee input (assigneeId or assignee)
    const assigneeParam = patch.assigneeId ?? patch.assignee;
    if (typeof assigneeParam !== "undefined") {
      if (assigneeParam) {
        if (!mongoose.isValidObjectId(assigneeParam))
          return bad(res, "Invalid assignee id");
        const emp = await Employee.findById(assigneeParam).lean();
        if (!emp) return bad(res, "Assignee not found", 404);
        patch.assignee = emp._id;
        patch.department = emp.department; // keep in sync
      } else {
        // clearing assignee also clears department
        patch.assignee = undefined;
        patch.department = undefined;
      }
      delete patch.assigneeId;
    }

    if (patch.dueDate) patch.dueDate = new Date(patch.dueDate);

    const row = await Task.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).populate("assignee", "fullName department");

    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (err) {
    console.error("Task update error:", err);
    bad(res, "Update failed", 500);
  }
};

/* ---------- MARK DONE: POST /hr/tasks/:id/done ---------- */
exports.markDone = async (req, res) => {
  try {
    const row = await Task.findByIdAndUpdate(
      req.params.id,
      { status: "done", updatedBy: req.user?.id },
      { new: true, runValidators: true }
    ).populate("assignee", "fullName department");
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    console.error("Task markDone error:", e);
    bad(res, "Failed to mark done", 500);
  }
};

/* ---------- DELETE (soft): DELETE /hr/tasks/:id ---------- */
exports.remove = async (req, res) => {
  try {
    const row = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, updatedBy: req.user?.id },
      { new: true }
    );
    if (!row) return bad(res, "Not found", 404);
    res.json({ ok: true });
  } catch (e) {
    console.error("Task remove error:", e);
    bad(res, "Delete failed", 500);
  }
};

/* ---------- RESTORE: POST /hr/tasks/:id/restore ---------- */
exports.restore = async (req, res) => {
  try {
    const row = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, updatedBy: req.user?.id },
      { new: true }
    ).populate("assignee", "fullName department");
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    console.error("Task restore error:", e);
    bad(res, "Restore failed", 500);
  }
};

/* ---------- COMMENT placeholder: POST /hr/tasks/:id/comment ---------- */
exports.comment = async (_req, res) => res.json({ ok: true });
