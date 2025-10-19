const YieldRecords = require("../Model/harvestManagement/YieldModel");
const { fitRidge, predict } = require("./ridge");

// ISO week helpers
function isoWeek(d0) {
  const d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

function weekLabel(y, w) {
  return `${y}-W${String(w).padStart(2,"0")}`;
}

async function loadWeekly(crop, section) {
  const q = { cropType: crop };
  if (section) q.greenhouseSection = section;

  const recs = await YieldRecords.find(q)
    .select("harvestdate quantity treesPicked greenhouseSection cropType")
    .lean();

  const map = new Map(); // key: YYYY-Www
  for (const r of recs) {
    const d = new Date(r.harvestdate);
    if (isNaN(d)) continue;
    const { year, week } = isoWeek(d);
    const key = weekLabel(year, week);
    const v = map.get(key) || { qty: 0, trees: 0, days: 0, year, week };
    v.qty += Number(r.quantity) || 0;
    v.trees += Number(r.treesPicked) || 0;
    v.days += 1;
    map.set(key, v);
  }

  return [...map.values()].sort((a, b) =>
    a.year === b.year ? a.week - b.week : a.year - b.year
  ).map(v => ({
    yw: weekLabel(v.year, v.week),
    year: v.year,
    week: v.week,
    totalQty: v.qty,
    totalTrees: v.trees,
    events: v.days
  }));
}

function seasonFeaturesWeek(week) {
  // 52-week seasonality
  const ang = 2 * Math.PI * (week / 52);
  return [Math.sin(ang), Math.cos(ang)];
}

function trainWeekly(rows) {
  const X = rows.map(r => [...seasonFeaturesWeek(r.week), r.totalTrees || 0, r.events || 0]);
  const y = rows.map(r => r.totalQty);
  const { theta, means, stds, r2, mse } = fitRidge(X, y, 1.0);
  return { theta, means, stds, r2, mse };
}

/**
 * Forecast next week. Fallback strategy if little history:
 * - if >= 3 weeks: use ridge regression
 * - else: use last 7 days total (simple mean of recent weeks entries)
 */
async function forecastNextWeek(crop, section, overrideTrees) {
  const rows = await loadWeekly(crop, section);

  // determine "next week" from last observed week
  if (!rows.length) throw new Error("Need at least 7 days of history to forecast");
  const last = rows[rows.length - 1];
  let nextYear = last.year, nextWeek = last.week + 1;
  if (nextWeek > 52) { nextYear += 1; nextWeek = 1; }

  // defaults
  const treesDefault = overrideTrees != null
    ? Number(overrideTrees)
    : Math.round((rows.map(r => r.totalTrees || 0).filter(x => x>0).reduce((a,b)=>a+b,0) / Math.max(1, rows.length)) || 0);
  const eventsDefault = Math.round((rows.map(r => r.events || 0).reduce((a,b)=>a+b,0) / Math.max(1, rows.length)) || 4);

  let estimate, r2 = null, rmse = null, samples = rows.length;

  if (rows.length >= 3) {
    const model = trainWeekly(rows);
    const x = [...seasonFeaturesWeek(nextWeek), treesDefault, eventsDefault];
    estimate = predict(model.theta, model.means, model.stds, x);
    r2 = model.r2;
    rmse = Math.sqrt(model.mse || 0);
  } else {
    // fallback: simple average of available weeks
    const avg = rows.reduce((a, r) => a + (r.totalQty || 0), 0) / rows.length;
    estimate = avg;
  }

  return {
    crop, section: section || null,
    next: { year: nextYear, week: nextWeek, estimateKg: Math.max(0, estimate), treesAssumed: treesDefault, eventsAssumed: eventsDefault },
    metrics: { r2, rmse, samples },
    history: rows
  };
}

module.exports = { forecastNextWeek };
