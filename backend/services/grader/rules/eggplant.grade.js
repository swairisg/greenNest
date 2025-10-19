// backend/Services/grader/rules/eggplant.grade.js
module.exports = function getEggplantGrade({ color, firmness, gloss, wrinkles }) {
    // Normalize to lowercase for safety
    const wr = (wrinkles || "").toLowerCase();
    const col = (color || "").toLowerCase();
    const glo = (gloss || "").toLowerCase();
    const firm = (firmness || "").toLowerCase();
  
    // A-grade conditions
    if (col === "deep purple" && glo === "shiny" && firm === "firm" && (wr === "" || wr === "none"))
      return "A";
  
    // B-grade conditions
    if (glo === "slightly dull" || wr === "minor")
      return "B";
  
    // Otherwise C
    return "C";
  };