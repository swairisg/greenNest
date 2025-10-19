// backend/Services/grader/rules/strawberry.grade.js
module.exports = function getStrawberryGrade({
  color,
  firmness,
  size,
  bruising,
  mold
}) {
  // normalize all values
  const col   = (color || "").toLowerCase().trim();
  const firm  = (firmness || "").toLowerCase().trim();
  const sz    = (size || "").toLowerCase().trim();
  const bru   = (typeof bruising === "string"
    ? bruising
    : (bruising ? "visible" : "none")
  ).toLowerCase().trim();
  const md    = (typeof mold === "string"
    ? mold
    : (mold ? "present" : "none")
  ).toLowerCase().trim();

  const noBruise = bru === "" || bru === "none" || bru === "false";
  const noMold   = md === "" || md === "none" || md === "false";

  // ✅ A-grade: perfect red, firm, no defects
  if (
    col === "bright red" &&
    firm === "firm" &&
    noBruise &&
    noMold
  ) return "A";

  // ⚠️ B-grade: slight softness or minor bruising
  if (
    firm === "slightly soft" ||
    bru === "minor"
  ) return "B";

  // ❌ Otherwise → C
  return "C";
};