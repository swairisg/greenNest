const mongoose = require("mongoose");
const Attendance = require("../../Model/tasksHR/Attendance");
const Employee = require("../../Model/tasksHR/EmployeeProfile");
const Shift = require("../../Model/tasksHR/ShiftTemplate");

const bad = (res, msg, code = 400) => res.status(code).json({ message: msg });

/* List with filters */
exports.list = async (req, res) => {
  try {
    const {
      search = "",
      department,
      employeeId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 10,
    } = req.query;

    const q = { deletedAt: null };

    if (search) {
      const rx = new RegExp(search, "i");
      q.$or = [{ "employee.fullName": rx }, { department: rx }];
    }
    if (department && department !== "all") q.department = department;
    if (employeeId && mongoose.isValidObjectId(employeeId))
      q.employee = employeeId;
    if (status && status !== "all") q.status = status;

    if (dateFrom || dateTo) {
      q.workDate = {};
      if (dateFrom) q.workDate.$gte = new Date(dateFrom);
      if (dateTo) q.workDate.$lte = new Date(dateTo);
    }

    const ps = Math.max(1, Number(pageSize));
    const skip = (Math.max(1, Number(page)) - 1) * ps;

    const [rows, total] = await Promise.all([
      Attendance.find(q)
        .populate("employee", "fullName department designation")
        .sort({ workDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(ps)
        .lean(),
      Attendance.countDocuments(q),
    ]);

    res.json({ data: rows, total, page: Number(page), pageSize: ps });
  } catch (e) {
    console.error(e);
    bad(res, "Failed to fetch attendance", 500);
  }
};

/* Assign shifts by department or explicit employee list for a date range */
exports.assign = async (req, res) => {
  try {
    const { department, employeeIds, templateId, startDate, endDate } =
      req.body || {};
    if (!templateId || !startDate || !endDate) {
      return bad(res, "templateId, startDate, endDate are required");
    }
    const tmpl = await Shift.findById(templateId).lean();
    if (!tmpl) return bad(res, "Shift template not found", 404);

    let emps = [];
    if (employeeIds?.length) {
      emps = await Employee.find(
        { _id: { $in: employeeIds } },
        "_id fullName department"
      ).lean();
    } else if (department) {
      emps = await Employee.find(
        { department },
        "_id fullName department"
      ).lean();
    } else {
      return bad(res, "Either department or employeeIds must be provided");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end < start)
      return bad(res, "Invalid date range");

    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    const docs = [];
    for (const e of emps) {
      for (const day of days) {
        docs.push({
          employee: e._id,
          department: e.department,
          workDate: new Date(day),
          shift: {
            name: tmpl.name,
            startMinutes: tmpl.startMinutes,
            endMinutes: tmpl.endMinutes,
            startLabel: tmpl.startLabel,
            endLabel: tmpl.endLabel,
          },
          status: "open",
        });
      }
    }

    if (docs.length) await Attendance.insertMany(docs);
    res.status(201).json({ ok: true, created: docs.length });
  } catch (e) {
    console.error(e);
    bad(res, "Assign failed", 500);
  }
};

/* Clock in / out */
exports.clockIn = async (req, res) => {
  const { attendanceId } = req.body || {};
  const row = await Attendance.findByIdAndUpdate(
    attendanceId,
    { checkIn: new Date(), status: "clocked_in" },
    { new: true }
  ).populate("employee", "fullName department designation");
  if (!row) return bad(res, "Not found", 404);
  res.json({ data: row });
};

exports.clockOut = async (req, res) => {
  const { attendanceId } = req.body || {};
  const row = await Attendance.findByIdAndUpdate(
    attendanceId,
    { checkOut: new Date(), status: "clocked_out" },
    { new: true }
  ).populate("employee", "fullName department designation");
  if (!row) return bad(res, "Not found", 404);
  res.json({ data: row });
};

/* Edit one record */
exports.update = async (req, res) => {
  const patch = {};
  const { workDate, checkIn, checkOut, status } = req.body || {};
  if (workDate) patch.workDate = new Date(workDate);
  if (checkIn) patch.checkIn = new Date(checkIn);
  if (checkOut) patch.checkOut = new Date(checkOut);
  if (status) patch.status = status;

  const row = await Attendance.findByIdAndUpdate(req.params.id, patch, {
    new: true,
  }).populate("employee", "fullName department designation");
  if (!row) return bad(res, "Not found", 404);
  res.json({ data: row });
};

/* Soft delete */
exports.remove = async (req, res) => {
  await Attendance.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
  res.json({ ok: true });
};
