// backend/Services/grader/rules/lettuce.grade.js
// Works for iceberg, romaine, butterhead
module.exports = function getLettuceGrade({
  headCompactness, // "tight" | "moderate" | "loose"
  color,           // "fresh green" | "pale" | "yellowing"
  edges,           // "clean" | "slightly browned" | "browned"
  pestDamage,      // "none" | "minor" | "visible" | false
  slime            // "none" | "trace" | "present" | false
}) {
  // normalize inputs
  const comp  = (headCompactness || "").toLowerCase().trim();
  const col   = (color || "").toLowerCase().trim();
  const edg   = (edges || "").toLowerCase().trim();
  const pest  = (typeof pestDamage === "string"
    ? pestDamage
    : (pestDamage ? "visible" : "none")
  ).toLowerCase().trim();
  const slm   = (typeof slime === "string"
    ? slime
    : (slime ? "present" : "none")
  ).toLowerCase().trim();

  const noPest  = pest === "" || pest === "none" || pest === "false";
  const noSlime = slm === "" || slm === "none" || slm === "false";

  // ✅ A-grade: ideal appearance
  if (
    comp === "tight" &&
    col === "fresh green" &&
    edg === "clean" &&
    noPest &&
    noSlime
  ) return "A";

  // ⚠️ B-grade: moderate or slight issues
  if (
    comp === "moderate" ||
    col === "pale" ||
    edg === "slightly browned" ||
    pest === "minor" ||
    slm === "trace"
  ) return "B";

  // ❌ C-grade: poor condition
  return "C";
};