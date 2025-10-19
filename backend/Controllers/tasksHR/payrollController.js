// backend/Controllers/tasksHR/payrollController.js
const mongoose = require("mongoose");
const Payrun = require("../../Model/tasksHR/Payrun");
const SalaryProfile = require("../../Model/tasksHR/SalaryProfile");

// These models should already exist in your project:
const Employee = require("../../Model/tasksHR/EmployeeProfile");
let Attendance;
try {
  Attendance = require("../../Model/tasksHR/Attendance"); // your attendance model filename
} catch {
  // If your file name is different (e.g., AttendanceRecord.js), change the require above.
  console.warn(
    "[payroll] Could not require Attendance model. Make sure the path is correct."
  );
}

const bad = (res, msg, code = 400) => res.status(code).json({ message: msg });

// helpers
const toDateMidnight = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const min = (a, b) => (a < b ? a : b);
const max = (a, b) => (a > b ? a : b);

/** Sum worked minutes in the interval using attendance checkIn/checkOut */
async function computeWorkedMinutes(employeeId, start, end) {
  if (!Attendance) return 0;

  const q = {
    employee: employeeId,
    status: { $in: ["clocked_out"] },
    checkIn: { $ne: null },
    checkOut: { $ne: null },
    // overlap with [start, end]
    $or: [
      { checkIn: { $lte: end }, checkOut: { $gte: start } },
      { workDate: { $gte: start, $lte: end } },
    ],
  };

  const rows = await Attendance.find(q).select("checkIn checkOut").lean();
  let minutes = 0;
  for (const r of rows) {
    const a = new Date(r.checkIn);
    const b = new Date(r.checkOut);
    // clamp to payrun window
    const s = max(a, start);
    const e = min(b, end);
    if (e > s) minutes += Math.round((e - s) / 60000);
  }
  return minutes;
}

/** compute entry for an employee */
async function computeEntry(emp, sal, start, end, otDailyMinutes = 0) {
  // worked time
  const workedMinutes = await computeWorkedMinutes(emp._id, start, end);

  // naive overtime: if a daily OT threshold is provided, approximate by
  // dividing total worked by 60*days; otherwise set 0 (you can improve later)
  let overtimeMinutes = 0;
  if (otDailyMinutes > 0) {
    // estimate business days in window
    const days = Math.max(
      1,
      Math.round(
        (toDateMidnight(end) - toDateMidnight(start)) / (24 * 60 * 60 * 1000)
      ) + 1
    );
    const threshold = days * otDailyMinutes;
    overtimeMinutes = Math.max(0, workedMinutes - threshold);
  }

  // money
  let basePay = 0;
  let overtimePay = 0;

  if (sal.payType === "hourly") {
    const hours = workedMinutes / 60;
    basePay = +(hours * (sal.hourlyRate || 0)).toFixed(2);

    const otHours = overtimeMinutes / 60;
    overtimePay = +(
      otHours *
      (sal.hourlyRate || 0) *
      (sal.overtimeRateMultiplier || 1.5)
    ).toFixed(2);
  } else if (sal.payType === "monthly") {
    basePay = +(sal.monthlyBase || 0);
    if (sal.hourlyRate) {
      const otHours = overtimeMinutes / 60;
      overtimePay = +(
        otHours *
        sal.hourlyRate *
        (sal.overtimeRateMultiplier || 1.5)
      ).toFixed(2);
    }
  }

  const totalAllowances = (sal.allowances || []).reduce(
    (s, a) => s + (a.amount || 0),
    0
  );
  const totalDeductions = (sal.deductions || []).reduce(
    (s, d) => s + (d.amount || 0),
    0
  );

  const gross = +(basePay + overtimePay + totalAllowances).toFixed(2);
  const net = +(gross - totalDeductions).toFixed(2);

  return {
    employee: emp._id,
    employeeName: emp.fullName || "-",
    department: emp.department || "-",
    payType: sal.payType,
    workedMinutes,
    overtimeMinutes,
    hourlyRate: sal.hourlyRate || undefined,
    monthlyBase: sal.monthlyBase || undefined,
    basePay,
    overtimePay,
    allowances: sal.allowances || [],
    deductions: sal.deductions || [],
    gross,
    net,
  };
}

/* -------------------------- ROUTES HANDLERS -------------------------- */

// POST /hr/payruns
exports.create = async (req, res) => {
  try {
    const { periodStart, periodEnd } = req.body || {};
    if (!periodStart || !periodEnd)
      return bad(res, "periodStart and periodEnd are required");
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (!(start < end)) return bad(res, "Invalid period");

    const doc = await Payrun.create({
      periodStart: start,
      periodEnd: end,
      status: "draft",
      createdBy: req.user?.id,
    });

    res.status(201).json({ data: doc });
  } catch (e) {
    console.error("payrun create error:", e);
    bad(res, "Failed to create payrun", 500);
  }
};

// GET /hr/payruns
exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const ps = Math.max(1, +pageSize);
    const skip = (Math.max(1, +page) - 1) * ps;

    const [rows, total] = await Promise.all([
      Payrun.find().sort({ periodStart: -1 }).skip(skip).limit(ps).lean(),
      Payrun.countDocuments(),
    ]);

    res.json({ data: rows, total, page: +page, pageSize: ps });
  } catch (e) {
    console.error("payrun list error:", e);
    bad(res, "Failed to fetch payruns", 500);
  }
};

// GET /hr/payruns/:id
exports.get = async (req, res) => {
  try {
    const row = await Payrun.findById(req.params.id).lean();
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    bad(res, "Not found", 404);
  }
};

// POST /hr/payruns/:id/compute
exports.compute = async (req, res) => {
  try {
    const payrun = await Payrun.findById(req.params.id);
    if (!payrun) return bad(res, "Not found", 404);

    const start = new Date(payrun.periodStart);
    const end = new Date(payrun.periodEnd);

    // load active employees + salary profiles
    const [emps, profiles] = await Promise.all([
      Employee.find({ currentStatus: { $in: ["active"] } })
        .select("_id fullName department")
        .lean(),
      SalaryProfile.find().lean(),
    ]);

    const profileByEmp = new Map(profiles.map((p) => [String(p.employee), p]));
    const entries = [];

    for (const emp of emps) {
      const sal = profileByEmp.get(String(emp._id));
      if (!sal) continue; // skip employees without a salary profile
      const entry = await computeEntry(
        emp,
        sal,
        start,
        end,
        /*otDailyMinutes*/ 8 * 60
      );
      entries.push(entry);
    }

    payrun.entries = entries;
    payrun.status = "computed";
    payrun.updatedBy = req.user?.id;
    await payrun.save();

    res.json({ data: payrun });
  } catch (e) {
    console.error("payrun compute error:", e);
    bad(res, "Compute failed", 500);
  }
};

// POST /hr/payruns/:id/approve
exports.approve = async (req, res) => {
  try {
    const row = await Payrun.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedAt: new Date(), updatedBy: req.user?.id },
      { new: true }
    );
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    bad(res, "Approve failed", 500);
  }
};

// POST /hr/payruns/:id/mark-paid
exports.markPaid = async (req, res) => {
  try {
    const row = await Payrun.findByIdAndUpdate(
      req.params.id,
      { status: "paid", paidAt: new Date(), updatedBy: req.user?.id },
      { new: true }
    );
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (e) {
    bad(res, "Mark paid failed", 500);
  }
};

// GET /hr/payruns/:id/payslips/:employeeId
// Returns a JSON payload; frontend can render/download PDF.
exports.payslip = async (req, res) => {
  try {
    const row = await Payrun.findById(req.params.id).lean();
    if (!row) return bad(res, "Not found", 404);

    const entry = (row.entries || []).find(
      (e) => String(e.employee) === String(req.params.employeeId)
    );
    if (!entry)
      return bad(res, "Payslip not found for employee in this payrun", 404);

    const payload = {
      payrun: {
        id: row._id,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        status: row.status,
      },
      entry,
    };
    res.json({ data: payload });
  } catch (e) {
    bad(res, "Payslip fetch failed", 500);
  }
};
