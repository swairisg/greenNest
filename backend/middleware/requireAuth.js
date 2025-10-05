const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    // decoded: { sub, roles, primaryRole, iat, exp }
    req.user = {
      id: decoded.sub,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      primaryRole: decoded.primaryRole || null,
    };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
