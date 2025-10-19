// backend/Services/grader/rules/carrot.grade.js
module.exports = function getCarrotGrade({
  size,
  color,
  straightness,
  cracks,
  freshness
}) {
  // normalize strings
  const c = (color || "").toLowerCase().trim();
  const s = (straightness || "").toLowerCase().trim();
  const cr = (cracks || "").toLowerCase().trim();

  // numeric freshness if user entered %
  const freshVal = typeof freshness === "number"
    ? freshness
    : Number(freshness);

  const isFresh = !isNaN(freshVal)
    ? freshVal >= 85 // consider 85+ fresh
    : (freshness || "").toLowerCase().trim() === "fresh";

  // A-grade: bright color, straight, no cracks, very fresh
  if (
    c === "bright" &&
    s === "straight" &&
    (cr === "" || cr === "none") &&
    isFresh
  ) return "A";

  // B-grade: moderate color or slight imperfections
  if (
    c === "moderate" ||
    s === "slightly curved" ||
    cr === "minor"
  ) return "B";

  // else C
  return "C";
};