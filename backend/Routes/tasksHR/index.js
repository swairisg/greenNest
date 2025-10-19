// backend/Routes/tasksHR/index.js (or wherever this file lives)
const express = require("express");
const { ensureAuth, requireRoles } = require("../../middleware/auth");

// Controllers
const people = require("../../Controllers/tasksHR/peopleController");
const tasks = require("../../Controllers/tasksHR/taskController");
const attendance = require("../../Controllers/tasksHR/attendanceController");
const shifts = require("../../Controllers/tasksHR/shiftsController");
const payroll = require("../../Controllers/tasksHR/payrollController");
const performance = require("../../Controllers/tasksHR/performanceController");

const router = express.Router();

// everything here requires auth + HR/Admin
router.use(ensureAuth, requireRoles(["admin", "hr_manager"]));

/* ===================== Employees ===================== */
router.get("/employees", people.list);
router.post("/employees", people.create);
router.get("/employees/:id", people.get);
router.patch("/employees/:id", people.update);
router.delete("/employees/:id", people.remove);
router.post("/employees/:id/restore", people.restore);

/* ===================== Tasks ===================== */
router.get("/tasks", tasks.list);
router.post("/tasks", tasks.create);
router.get("/tasks/:id", tasks.get);
router.patch("/tasks/:id", tasks.update);
router.post("/tasks/:id/comment", tasks.comment);
router.delete("/tasks/:id", tasks.remove);

//* Shifts (AM/PM times) */
router.get("/shifts", shifts.list);
router.post("/shifts", shifts.create);
router.patch("/shifts/:id", shifts.update);
router.delete("/shifts/:id", shifts.remove);

/* Attendance */
router.get("/attendance", attendance.list);
router.post("/attendance/assign", attendance.assign);
router.post("/attendance/clock-in", attendance.clockIn);
router.post("/attendance/clock-out", attendance.clockOut);
router.patch("/attendance/:id", attendance.update);
router.delete("/attendance/:id", attendance.remove);

/* ===================== Payroll ===================== */
router.post("/payruns", payroll.create);
router.get("/payruns", payroll.list);
router.get("/payruns/:id", payroll.get);
router.post("/payruns/:id/compute", payroll.compute);
router.post("/payruns/:id/approve", payroll.approve);
router.post("/payruns/:id/mark-paid", payroll.markPaid);
router.get("/payruns/:id/payslips/:employeeId", payroll.payslip);

/* ===================== Performance ===================== */
router.get("/performance", performance.list);
router.post("/performance", performance.create);
router.get("/performance/:id", performance.get);
router.patch("/performance/:id", performance.update);
router.post("/performance/:id/finalize", performance.finalize);

module.exports = router;
