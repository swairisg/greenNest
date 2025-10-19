// backend/services/grader/rules/tomato.grade.js
module.exports = function ({ color, firmness, cracks, blemishes }) {
  if (color === "uniform red" && firmness === "firm" && cracks === "none" && blemishes === "none") return "A";
  if (firmness === "slightly soft" || cracks === "minor" || blemishes === "few") return "B";
  return "C";
};