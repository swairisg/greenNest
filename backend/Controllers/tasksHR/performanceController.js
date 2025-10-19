const mongoose = require("mongoose");
const PerformanceReview = require("../../Model/tasksHR/PerformanceReview");
const Employee = require("../../Model/tasksHR/EmployeeProfile");

const bad = (res, msg, code = 400) => res.status(code).json({ message: msg });

/* ------------------------- Helpers ------------------------- */
function computeOverall(goals = []) {
  if (!goals.length) return 0;
  // Use managerScore if present, else selfScore; default 0
  let totalWeight = 0;
  let sum = 0;
  goals.forEach((g) => {
    const w = Number(g.weight ?? 1);
    const s =
      typeof g.managerScore === "number"
        ? g.managerScore
        : typeof g.selfScore === "number"
        ? g.selfScore
        : 0;
    totalWeight += w;
    sum += w * s;
  });
  return totalWeight ? Number((sum / totalWeight).toFixed(2)) : 0;
}

/* ------------------------- LIST ------------------------- */
// GET /hr/performance
exports.list = async (req, res) => {
  try {
    const {
      search = "",
      status,
      department,
      employeeId,
      periodFrom,
      periodTo,
      page = 1,
      pageSize = 10,
    } = req.query;

    const q = {};
    if (status && status !== "all") q.status = status;
    if (department && department !== "all") q.department = department;
    if (employeeId && mongoose.isValidObjectId(employeeId))
      q.employee = employeeId;

    if (periodFrom || periodTo) {
      q.$and = q.$and || [];
      if (periodFrom)
        q.$and.push({ periodEnd: { $gte: new Date(periodFrom) } });
      if (periodTo) q.$and.push({ periodStart: { $lte: new Date(periodTo) } });
    }

    // simple text search
    if (search) {
      if (search.length >= 3) q.$text = { $search: search };
      else q.title = { $regex: search, $options: "i" };
    }

    const ps = Math.max(1, Number(pageSize));
    const skip = (Math.max(1, Number(page)) - 1) * ps;

    const [rows, total] = await Promise.all([
      PerformanceReview.find(q)
        .populate("employee", "fullName department designation")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ps),
      PerformanceReview.countDocuments(q),
    ]);

    res.json({ data: rows, total, page: Number(page), pageSize: ps });
  } catch (err) {
    console.error("Performance list error:", err);
    bad(res, "Failed to fetch performance reviews", 500);
  }
};

/* ------------------------- CREATE ------------------------- */
// POST /hr/performance
exports.create = async (req, res) => {
  try {
    const {
      employeeId,
      periodStart,
      periodEnd,
      title,
      goals = [], // [{key,label,weight,selfScore,managerScore,notes}]
      summary,
    } = req.body || {};

    if (!employeeId || !mongoose.isValidObjectId(employeeId))
      return bad(res, "Valid employeeId is required");
    if (!periodStart || !periodEnd)
      return bad(res, "periodStart and periodEnd are required");

    const emp = await Employee.findById(employeeId).lean();
    if (!emp) return bad(res, "Employee not found", 404);

    const overallScore = computeOverall(goals);

    const doc = await PerformanceReview.create({
      employee: emp._id,
      department: emp.department,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      title: (title || `${emp.fullName} Review`).trim(),
      goals,
      summary,
      overallScore,
      status: "open",
      createdBy: req.user?.id,
    });

    res.status(201).json({ data: doc });
  } catch (err) {
    console.error("Performance create error:", err);
    bad(res, "Failed to create performance review", 500);
  }
};

/* ------------------------- GET ONE ------------------------- */
// GET /hr/performance/:id
exports.get = async (req, res) => {
  try {
    const row = await PerformanceReview.findById(req.params.id).populate(
      "employee",
      "fullName department designation"
    );
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (err) {
    bad(res, "Not found", 404);
  }
};

/* ------------------------- UPDATE ------------------------- */
// PATCH /hr/performance/:id
exports.update = async (req, res) => {
  try {
    const patch = { ...req.body, updatedBy: req.user?.id };

    // If goals updated, recompute overallScore
    if (Array.isArray(patch.goals)) {
      patch.overallScore = computeOverall(patch.goals);
    }

    // protect illegal status transitions
    if (
      patch.status &&
      !["open", "in_review", "finalized"].includes(patch.status)
    ) {
      return bad(res, "Invalid status");
    }

    // prevent changing employee directly
    if (patch.employee || patch.employeeId)
      delete patch.employeeId, delete patch.employee;

    const row = await PerformanceReview.findByIdAndUpdate(
      req.params.id,
      patch,
      {
        new: true,
        runValidators: true,
      }
    ).populate("employee", "fullName department designation");

    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (err) {
    console.error("Performance update error:", err);
    bad(res, "Update failed", 500);
  }
};

/* ------------------------- FINALIZE ------------------------- */
// POST /hr/performance/:id/finalize
exports.finalize = async (req, res) => {
  try {
    const row = await PerformanceReview.findById(req.params.id);
    if (!row) return bad(res, "Not found", 404);
    if (row.status === "finalized") return bad(res, "Already finalized");

    // lock scores & compute final
    const finalOverall = computeOverall(row.goals);
    row.overallScore = finalOverall;
    row.status = "finalized";
    row.finalizedAt = new Date();
    row.finalizedBy = req.user?.id;
    await row.save();

    const populated = await row.populate(
      "employee",
      "fullName department designation"
    );
    res.json({ data: populated });
  } catch (err) {
    console.error("Performance finalize error:", err);
    bad(res, "Finalize failed", 500);
  }
};
