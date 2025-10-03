const jwt = require("jsonwebtoken");
const { User } = require("../Model/auth");
// attach req.user if token is valid
async function ensureAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
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

// require any of the roles
function requireRoles(allowed = []) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    const ok = roles.some((r) => allowed.includes(r));
    if (!ok) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { ensureAuth, requireRoles };
