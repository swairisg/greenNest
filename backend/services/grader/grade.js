// backend/services/grader/grade.js  (replace gradeRecord and helpers if needed)
const fs = require("fs");
const path = require("path");
const cache = new Map();
const RULES_DIR = path.join(__dirname, "rules");

function toNum(v) {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function norm(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim().toLowerCase();
}

function loadRule(productName, variety) {
  const key = `${norm(productName)}__${norm(variety)}`;
  if (cache.has(key)) return cache.get(key);

  const p = norm(productName).replace(/\s+/g, ".");
  const v = norm(variety).replace(/\s+/g, ".");
  const candidates = [
    `${p}.${v}.json`,
    `${p}.json`,
    `default.json`,
    `${p}.${v}.grade.js`,
    `${p}.grade.js`,
    `default.grade.js`,
  ];

  for (const fname of candidates) {
    const full = path.join(RULES_DIR, fname);
    if (fs.existsSync(full)) {
      const cfg = fname.endsWith(".json")
        ? JSON.parse(fs.readFileSync(full, "utf8"))
        : require(full);
      cache.set(key, cfg);
      return cfg;
    }
  }
  throw new Error(`No grading rule found for ${productName}/${variety}`);
}

function gradeRecord(docLike = {}) {
  const productName = norm(docLike.productName);
  const variety = norm(docLike.variety);
  const cfg = loadRule(productName, variety);

  const r = docLike.readings || {};
  const facts = {
    productName,
    variety,
    // ✅ read from top-level OR readings, and trim/lowercase
    color:     norm(docLike.color     ?? r.color),
    size:      norm(docLike.size      ?? r.size),
    firmness:  norm(docLike.firmness  ?? r.firmness),
    cracks:    norm(docLike.cracks    ?? r.cracks),
    blemishes: norm(docLike.blemishes ?? r.blemishes),
    freshness: toNum(docLike.freshness ?? r.freshness),
    weight:    toNum(docLike.weight    ?? r.weight),
    readings:  r,
  };

  if (typeof cfg === "function") {
    const systemGrade = cfg(facts) || "C";
    return { grade: { system: systemGrade } };
  }

  if (typeof cfg === "object" && cfg.kind === "thresholds") {
    const flatFacts = {
      color: facts.color,
      size: facts.size,
      firmness: facts.firmness,
      cracks: facts.cracks,
      blemishes: facts.blemishes,
      freshness: facts.freshness,
      weight: facts.weight,
      ...Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, toNum(v) ?? norm(v)])
      ),
    };
    const systemGrade = gradeFromJsonRule(cfg, flatFacts);
    return { grade: { system: systemGrade } };
  }

  throw new Error(`No grading rule found for ${productName}/${variety}`);
}

// keep your gradeFromJsonRule implementation as-is if you already have it
module.exports = { gradeRecord, loadRule };