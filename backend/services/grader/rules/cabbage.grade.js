// backend/Services/grader/rules/cabbage.grade.js
module.exports = function getCabbageGrade({
    compactness,
    color,
    pestDamage,
    freshness
  }) {
    // Normalize everything to lowercase, trimmed strings
    const comp = (compactness || "").toLowerCase().trim();
    const col  = (color || "").toLowerCase().trim();
    const pest = (typeof pestDamage === "string"
      ? pestDamage
      : (pestDamage ? "visible" : "none")
    ).toLowerCase().trim();
  
    // Numeric or text freshness
    const freshVal = typeof freshness === "number" ? freshness : Number(freshness);
    const isFresh = !isNaN(freshVal)
      ? freshVal >= 85
      : (freshness || "").toLowerCase().trim() === "fresh";
  
    const noPest = pest === "" || pest === "none" || pest === "false";
  
    // A-grade: tight, green, no pest, fresh
    if (comp === "tight" && col === "fresh green" && noPest && isFresh)
      return "A";
  
    // B-grade: moderate or minor pest
    if (comp === "moderate" || pest === "minor")
      return "B";
  
    // otherwise C
    return "C";
  };