const jwt = require("jsonwebtoken");
// If you use a barrel export, keep this, otherwise do: const User = require("../Model/auth/User");
const { User } = require("../Model/auth");

async function ensureAuth(req, res, next) {
  try {
    const raw = req.headers.authorization || "";
    const parts = raw.split(" ");
    const token = parts[0] === "Bearer" ? parts[1] : null;

    if (
      !token ||
      token === "undefined" ||
      token === "null" ||
      token.length < 16
    ) {
      return res.status(401).json({ message: "Missing token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Invalid user" });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      roles: user.roles || [],
      primaryRole: user.primaryRole,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Auth failed" });
  }
}

function requireRoles(allowed = []) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const ok = roles.some((r) => allowed.includes(r));
    if (!ok) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { ensureAuth, requireRoles };
