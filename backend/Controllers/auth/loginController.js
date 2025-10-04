const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../Model/auth/User");

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "email and password required" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: `Account status: ${user.status}` });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        roles: user.roles,
        primaryRole: user.primaryRole,
      },
      process.env.JWT_SECRET || "dev-secret", // set a real secret in .env
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      data: {
        user: {
          id: String(user._id),
          email: user.email,
          roles: user.roles,
          primaryRole: user.primaryRole,
          status: user.status,
          name: user.name,
          phone: user.phone,
          address: user.address,
        },
      },
    });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /auth/logout  (no session yet; simple OK)
exports.logout = async (_req, res) => res.json({ success: true });
