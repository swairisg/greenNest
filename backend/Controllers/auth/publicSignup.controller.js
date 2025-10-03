const bcrypt = require("bcryptjs");
const User = require("../../Model/auth/User");

// simple strength check: 8+ chars, 1 lower, 1 upper, 1 digit
const isStrong = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

exports.customerSignup = async (req, res) => {
  try {
    const { email, password, confirmPassword, phone, address, name } = req.body;

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
      // isEmailVerified: false,  // uncomment if you want to force verification (your schema default is true)
      // Optional customer profile data (if you store them in a separate CustomerProfile model, ignore here)
      // you can stitch phone/address/name into that model in a later step
    });

    return res.status(201).json({
      message: "Account created",
      user: {
        _id: doc._id,
        email: doc.email,
        roles: doc.roles,
        primaryRole: doc.primaryRole,
        status: doc.status,
      },
    });
  } catch (err) {
    console.error("Public signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
