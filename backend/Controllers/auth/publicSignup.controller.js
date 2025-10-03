const bcrypt = require("bcryptjs");
const User = require("../../Model/auth/User");
const isCompanyEmail = require("../../utils/isCompanyEmail");

// simple strength check: 8+ chars, 1 lower, 1 upper, 1 digit
const isStrong = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

exports.customerSignup = async (req, res) => {
  try {
    const { email, password, confirmPassword, name, phone, address } = req.body;

    // minimal required: email + password (name/phone/address if you store them elsewhere, ignore here)
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (!isStrong(password)) {
      return res.status(400).json({
        message: "Use 8+ chars with upper, lower, and a number.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Block company emails on public signup
    if (isCompanyEmail(normalizedEmail)) {
      return res.status(403).json({
        message:
          "This looks like a company email. Staff accounts must use the invite link from HR.",
      });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create using YOUR fields
    const doc = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      roles: ["customer"],
      primaryRole: "customer",
      status: "active", // or "pending" if you plan approval
      source: "publicSignup",
      name: name?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    return res.status(201).json({
      message: "Account created",
      user: {
        _id: doc._id,
        email: doc.email,
        roles: doc.roles,
        primaryRole: doc.primaryRole,
        status: doc.status,
        name: doc.name,
        phone: doc.phone,
        address: doc.address,
      },
    });
  } catch (err) {
    console.error("Public signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
