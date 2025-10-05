// backend/Controllers/auth/customerProfile.controller.js
const User = require("../../Model/auth/User");

const isPhone = (v = "") => /^[+()\-.\s\d]{7,20}$/.test(String(v).trim());

// GET /api/auth/profile/:id
exports.getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await User.findById(id).lean();
    if (!doc) return res.status(404).json({ message: "User not found" });
    if (!doc.roles?.includes("customer")) {
      return res.status(403).json({ message: "Not a customer account" });
    }
    return res.json({
      user: {
        id: String(doc._id),
        email: doc.email,
        roles: doc.roles,
        primaryRole: doc.primaryRole,
        status: doc.status,
        name: doc.name,
        phone: doc.phone,
        address: doc.address,
      },
    });
  } catch (e) {
    console.error("getCustomerProfile error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/auth/profile/:id
exports.updateCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body || {};

    const doc = await User.findById(id);
    if (!doc) return res.status(404).json({ message: "User not found" });
    if (!doc.roles?.includes("customer")) {
      return res.status(403).json({ message: "Not a customer account" });
    }

    if (phone && !isPhone(phone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    if (typeof name === "string") doc.name = name.trim();
    if (typeof phone === "string") doc.phone = phone.trim();
    if (typeof address === "string") doc.address = address.trim();

    await doc.save();

    return res.json({
      message: "Profile updated",
      user: {
        id: String(doc._id),
        email: doc.email,
        roles: doc.roles,
        primaryRole: doc.primaryRole,
        status: doc.status,
        name: doc.name,
        phone: doc.phone,
        address: doc.address,
      },
    });
  } catch (e) {
    console.error("updateCustomerProfile error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
