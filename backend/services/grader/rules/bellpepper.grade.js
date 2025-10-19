// backend/Services/grader/rules/bellpepper.grade.js
module.exports = function getBellPepperGrade({
  color,
  shape,
  firmness,
  skin
}) {
  // Normalize to lowercase strings
  const col  = (color || "").toLowerCase().trim();
  const shp  = (shape || "").toLowerCase().trim();
  const firm = (firmness || "").toLowerCase().trim();
  const sk   = (skin || "").toLowerCase().trim();

  // A-grade: ideal shape, color, firmness, and skin quality
  if (
    col === "bright" &&
    firm === "firm" &&
    sk === "smooth" &&
    shp === "uniform"
  ) return "A";

  // B-grade: slight dullness or small shape deformities
  if (
    col === "slightly dull" ||
    shp === "minor deformities" ||
    sk === "slightly rough" ||
    firm === "slightly soft"
  ) return "B";

  // everything else = C
  return "C";
};