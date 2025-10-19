// backend/services/grader/aggregate.js

/**
 * Compute the final grade from system & human inputs under a given policy.
 *
 * Policies:
 * - "system_only":      Always use system grade.
 * - "human_only":       Use human if present; otherwise fallback to system.
 * - "human_overrides":  If human present, use it; else system. (DEFAULT for admin)
 * - "weighted":         Blend system & human using weights {system, human}.
 *
 * Inputs:
 *   system: string|null   e.g., "A", "B", "C", ...
 *   human:  string|null   e.g., "A", "B", null
 *   policy: string        one of the above
 *   weights: { system:number, human:number }
 *
 * Output:
 *   { final: string|null, decidedBy: "system"|"human"|"weighted"|"fallback" }
 */

function computeFinal({ system = null, human = null, policy = "human_overrides", weights = { system: 0.4, human: 0.6 } }) {
    // Normalize string inputs
    system = normGrade(system);
    human  = normGrade(human);
  
    // If nothing to decide from
    if (!system && !human) {
      return { final: null, decidedBy: "fallback" };
    }
  
    switch (policy) {
      case "system_only": {
        return { final: system ?? human ?? null, decidedBy: "system" };
      }
  
      case "human_only": {
        // Prefer human; fallback to system if human not given
        const final = human ?? system ?? null;
        return { final, decidedBy: human ? "human" : "system" };
      }
  
      case "human_overrides": {
        // Admin set human → wins; else system
        if (human) return { final: human, decidedBy: "human" };
        if (system) return { final: system, decidedBy: "system" };
        return { final: null, decidedBy: "fallback" };
      }
  
      case "weighted": {
        // Need at least one side to be present
        const w = sanitizeWeights(weights);
        const haveSystem = !!system;
        const haveHuman  = !!human;
  
        if (haveSystem && haveHuman) {
          const sScore = gradeToScore(system);
          const hScore = gradeToScore(human);
          const blended = (sScore * w.system + hScore * w.human) / (w.system + w.human || 1);
          const final = scoreToGrade(blended);
          return { final, decidedBy: "weighted" };
        }
  
        // If only one exists, use it
        if (haveHuman)  return { final: human, decidedBy: "human" };
        if (haveSystem) return { final: system, decidedBy: "system" };
        return { final: null, decidedBy: "fallback" };
      }
  
      default: {
        // Unknown policy → behave like human_overrides
        if (human) return { final: human, decidedBy: "human" };
        if (system) return { final: system, decidedBy: "system" };
        return { final: null, decidedBy: "fallback" };
      }
    }
  }
  
  /* --------------------------
   * Helpers
   * -------------------------- */
  
  // Simple 6-point scale. Extend if you need +/- later.
  const ORDER = ["A", "B", "C", "D", "E", "F"]; // 0 best index? We'll map to numeric for weighting.
  
  function normGrade(g) {
    if (!g || typeof g !== "string") return null;
    const up = g.trim().toUpperCase();
    // Keep only plain letters A-F; strip +/- if you don’t support them
    const base = up.replace(/[+\-]/g, "");
    return ORDER.includes(base) ? base : null;
  }
  
  // Map letter → numeric score (higher is better)
  function gradeToScore(g) {
    // A=5, B=4, C=3, D=2, E=1, F=0
    const map = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
    return map[g] ?? 0;
  }
  
  // Map numeric score back → nearest letter
  function scoreToGrade(score) {
    if (score >= 4.5) return "A";
    if (score >= 3.5) return "B";
    if (score >= 2.5) return "C";
    if (score >= 1.5) return "D";
    if (score >= 0.5) return "E";
    return "F";
  }
  
  function sanitizeWeights(w = {}) {
    const s = Number.isFinite(w.system) ? w.system : 0;
    const h = Number.isFinite(w.human) ? w.human  : 0;
    // If both are zero, default to human-overrides style
    if (s === 0 && h === 0) return { system: 0.4, human: 0.6 };
    return { system: Math.max(0, s), human: Math.max(0, h) };
  }
  
  module.exports = { computeFinal, _internals: { normGrade, gradeToScore, scoreToGrade, sanitizeWeights } };