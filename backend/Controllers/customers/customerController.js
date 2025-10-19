// Controllers/customers/customerController.js
const User = require("../../Model/auth/User"); // adjust if your path differs

// ---------- helpers ----------
const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
const isPhone = (v = "") => /^[+()\-.\s\d]{7,20}$/.test(String(v));
const legacyMap = { new: "pending", approved: "active" };

function normalizeStatusForDB(nextStatus) {
  if (!nextStatus) return null;
  const ui = String(nextStatus).toLowerCase();
  const enums = (User.schema.path("status")?.enumValues) || [];
  if (enums.includes(ui)) return ui;
  const mapped = legacyMap[ui];
  if (mapped && enums.includes(mapped)) return mapped;
  return { error: `Invalid status '${nextStatus}'. Allowed: ${enums.join(", ")}` };
}

function validateForCreate(payload = {}) {
  const errs = [];
  const { email, name, phone, address } = payload;
  if (!isEmail(email)) errs.push("Valid email is required.");
  if (name && String(name).trim().length < 2) errs.push("Name must be at least 2 characters.");
  if (phone && !isPhone(phone)) errs.push("Valid phone number is required.");
  if (address && String(address).length > 300) errs.push("Address must be 300 characters or less.");
  return errs;
}

function validateForUpdate(payload = {}) {
  const errs = [];
  const { email, name, phone, address, status } = payload;
  if (email && !isEmail(email)) errs.push("Valid email is required.");
  if (name && String(name).trim().length < 2) errs.push("Name must be at least 2 characters.");
  if (phone && !isPhone(phone)) errs.push("Valid phone number is required.");
  if (address && String(address).length > 300) errs.push("Address must be 300 characters or less.");
  if (status) {
    const norm = normalizeStatusForDB(status);
    if (norm && norm.error) errs.push(norm.error);
  }
  return errs;
}

// ---------- Controllers ----------

// GET /
exports.listCustomers = async (req, res) => {
  try {
    const filter = { primaryRole: "customer" };

    if (req.query.email) filter.email = String(req.query.email).trim();
    if (req.query.status) {
      const norm = normalizeStatusForDB(req.query.status);
      if (norm && norm.error) return res.status(400).json({ message: norm.error });
      filter.status = norm;
    }
    if (req.query.q) {
      const re = new RegExp(String(req.query.q).trim(), "i");
      filter.$or = [{ name: re }, { email: re }, { phone: re }, { address: re }];
    }

    const list = await User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({ data: list });
  } catch (err) {
    console.error("listCustomers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /:id
exports.getCustomerById = async (req, res) => {
  try {
    const doc = await User.findOne({ _id: req.params.id, primaryRole: "customer" })
      .select("-passwordHash");
    if (!doc) return res.status(404).json({ message: "Customer not found" });
    return res.json({ data: doc });
  } catch (err) {
    console.error("getCustomerById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /:id
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatable = ["name","phone","address","status","isEmailVerified","email"];
    const payload = {};
    for (const k of updatable) if (k in req.body) payload[k] = req.body[k];

    const errors = validateForUpdate(payload);
    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    if ("status" in payload) {
      const norm = normalizeStatusForDB(payload.status);
      if (norm && norm.error) return res.status(400).json({ message: norm.error });
      payload.status = norm;
    }

    delete payload.roles;
    delete payload.primaryRole;
    delete payload.passwordHash;

    const doc = await User.findOneAndUpdate(
      { _id: id, primaryRole: "customer" },
      payload,
      { new: true, runValidators: true, context: "query" }
    ).select("-passwordHash");

    if (!doc) return res.status(404).json({ message: "Customer not found" });
    return res.json({ data: doc, message: "Customer updated" });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: "Email already in use" });
    }
    console.error("updateCustomer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /:id
exports.deleteCustomer = async (req, res) => {
  try {
    const doc = await User.findOneAndDelete({ _id: req.params.id, primaryRole: "customer" });
    if (!doc) return res.status(404).json({ message: "Customer not found" });
    return res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error("deleteCustomer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /
exports.createCustomer = async (req, res) => {
  try {
    const errors = validateForCreate(req.body);
    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    const { email, name, phone, address } = req.body;
    const doc = await User.create({
      email,
      name: name?.trim() || "",
      phone: phone || "",
      address: address || "",
      passwordHash: "!", // placeholder
      roles: ["customer"],
      primaryRole: "customer",
      source: "invite",
      status: "active",
      isEmailVerified: false,
    });

    return res.status(201).json({
      data: await User.findById(doc._id).select("-passwordHash"),
      message: "Customer created",
    });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: "Email already in use" });
    }
    console.error("createCustomer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
