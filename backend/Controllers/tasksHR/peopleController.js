// backend/Controllers/tasksHR/peopleController.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Employee = require("../../Model/tasksHR/EmployeeProfile");
const User = require("../../Model/auth/User");

const isStrong = (pwd) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(pwd));
const bad = (res, msg, code = 400) => res.status(code).json({ message: msg });

/* ---------- LIST: GET /hr/employees ---------- */
async function list(req, res) {
  try {
    const {
      search = "",
      status,
      page = 1,
      pageSize = 10,
      includeDeleted = "false",
    } = req.query;

    const q = {};
    if (status) q.currentStatus = status;
    if (includeDeleted !== "true") q.isDeleted = false;

    if (search) {
      if (search.length >= 3) q.$text = { $search: search };
      else q.fullName = { $regex: search, $options: "i" };
    }

    const ps = Math.max(1, Number(pageSize));
    const skip = (Math.max(1, Number(page)) - 1) * ps;

    const [rows, total] = await Promise.all([
      Employee.find(q).sort({ createdAt: -1 }).skip(skip).limit(ps),
      Employee.countDocuments(q),
    ]);

    res.json({ data: rows, total, page: Number(page), pageSize: ps });
  } catch (err) {
    console.error("Employees list error:", err);
    bad(res, "Failed to fetch employees", 500);
  }
}

/* ---------- CREATE: POST /hr/employees ---------- */
async function create(req, res) {
  const body = req.body || {};
  try {
    const linkExisting = !!body.userId;
    const createNew = !!body.email && !!body.password;

    if (!linkExisting && !createNew)
      return bad(res, "Provide either userId OR email + password");
    if (createNew) {
      const email = String(body.email).toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return bad(res, "Invalid email");
      if (!isStrong(body.password))
        return bad(
          res,
          "Weak password (use 8+ chars incl. upper, lower, number)"
        );
      if (!body.primaryRole) return bad(res, "primaryRole is required");
    }

    const must = (k, label) => {
      if (!String(body[k] || "").trim())
        throw new Error(`${label} is required`);
    };
    must("fullName", "fullName");
    must("department", "department");
    must("designation", "designation");
    must("joinDate", "joinDate");
    if (body.salary != null && Number(body.salary) < 0)
      return bad(res, "salary cannot be negative");

    let userId = body.userId;

    if (!userId) {
      const email = String(body.email).toLowerCase().trim();
      const exists = await User.findOne({ email }).lean();
      if (exists) return bad(res, "Email already registered", 409);

      const passwordHash = await bcrypt.hash(String(body.password), 10);
      const roles = [String(body.primaryRole)];

      const newUser = await User.create({
        email,
        passwordHash,
        roles,
        primaryRole: roles[0],
        status: "active",

        name: body.fullName,
        phone: body.phone || undefined,
        address: body.address || undefined,
        isEmailVerified: false,
      });

      userId = newUser._id;
    } else {
      if (!mongoose.isValidObjectId(userId))
        return bad(res, "userId must be a valid ObjectId");
      const u = await User.findById(userId).lean();
      if (!u) return bad(res, "Linked userId not found", 404);
    }

    const dupProfile = await Employee.findOne({ userId });
    if (dupProfile)
      return bad(res, "Profile already exists for this user", 409);

    const doc = await Employee.create({
      userId,
      fullName: String(body.fullName).trim(),
      email: (body.email || "").toLowerCase().trim() || undefined,
      phone: body.phone || undefined,
      address: body.address || undefined,
      department: String(body.department).trim(),
      designation: String(body.designation).trim(),
      joinDate: body.joinDate,
      currentStatus: body.currentStatus || "active",
      salary: body.salary ? Number(body.salary) : 0,
      bank: body.bank || {
        accountNo: body.bank?.accountNo || body.bank_accountNo || undefined,
        bankName: body.bank?.bankName || body.bank_bankName || undefined,
        branch: body.bank?.branch || body.bank_branch || undefined,
      },
      createdBy: req.user?._id,
    });

    res.status(201).json({ data: doc });
  } catch (err) {
    if (err && err.code === 11000) {
      if (err.keyPattern?.userId)
        return bad(res, "Profile already exists for this user", 409);
      if (err.keyPattern?.email)
        return bad(res, "Email already registered", 409);
    }
    if (err?.name === "ValidationError") {
      const firstMsg =
        Object.values(err.errors)[0]?.message || "Validation error";
      return bad(res, firstMsg, 400);
    }
    if (/ is required$/.test(err.message)) return bad(res, err.message, 400);

    console.error("Employee create error:", err);
    bad(res, "Failed to create employee", 500);
  }
}

/* ---------- GET: /hr/employees/:id ---------- */
async function get(req, res) {
  try {
    const row = await Employee.findById(req.params.id);
    if (!row || row.isDeleted) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch {
    bad(res, "Not found", 404);
  }
}

/* ---------- UPDATE: PATCH /hr/employees/:id ---------- */
async function update(req, res) {
  try {
    const patch = { ...req.body, updatedBy: req.user?._id };
    const row = await Employee.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch (err) {
    if (err?.name === "ValidationError") {
      const firstMsg =
        Object.values(err.errors)[0]?.message || "Validation error";
      return bad(res, firstMsg, 400);
    }
    bad(res, "Update failed", 500);
  }
}

/* ---------- DELETE (soft): /hr/employees/:id ---------- */
async function remove(req, res) {
  try {
    const row = await Employee.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, currentStatus: "inactive", updatedBy: req.user?._id },
      { new: true }
    );
    if (!row) return bad(res, "Not found", 404);
    res.json({ data: row });
  } catch {
    bad(res, "Delete failed", 500);
  }
}

module.exports = { list, create, get, update, remove };
