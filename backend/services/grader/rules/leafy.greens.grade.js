// backend/Services/grader/rules/leafy.greens.grade.js
// Generic rule for spinach, kale, amaranth, gotu kola, etc.
module.exports = function getLeafyGreensGrade({
  color,          // "vibrant green" | "moderate green" | "yellowing"
  crispness,      // "crisp" | "slightly limp" | "limp"
  leafIntegrity,  // "intact" | "minor tears" | "torn"
  pestDamage,     // false | "none" | "minor" | "visible"
  wilting         // false | "none" | "slight" | "severe"
}) {
  // Normalize all inputs to safe, comparable strings
  const col   = (color || "").toLowerCase().trim();
  const crisp = (crispness || "").toLowerCase().trim();
  const integ = (leafIntegrity || "").toLowerCase().trim();

  // pestDamage can be boolean or string; treat false/""/"none" as no damage
  const pest = (typeof pestDamage === "string"
    ? pestDamage
    : (pestDamage ? "visible" : "none")
  ).toLowerCase().trim();

  // wilting can be boolean or string; treat false/""/"none" as no wilting
  const wilt = (typeof wilting === "string"
    ? wilting
    : (wilting ? "severe" : "none")
  ).toLowerCase().trim();

  const noPest  = pest === "" || pest === "none";
  const noWilt  = wilt === "" || wilt === "none";

  // A-grade: pristine greens
  if (
    col === "vibrant green" &&
    crisp === "crisp" &&
    integ === "intact" &&
    noPest &&
    noWilt
  ) {
    return "A";
  }

  // B-grade: any moderate issues
  if (
    col === "moderate green" ||
    crisp === "slightly limp" ||
    integ === "minor tears" ||
    pest === "minor" ||
    wilt === "slight"
  ) {
    return "B";
  }

  // Otherwise C
  return "C";
};