const { forecastNextWeek } = require("../../services/weeklyForecastService");

exports.weeklyForecast = async (req, res) => {
  try {
    const { crop, section, trees } = req.query;
    if (!crop) return res.status(400).json({ message: "crop is required" });

    const out = await forecastNextWeek(crop, section, trees);
    const points = out.history.map(r => ({ yw: r.yw, kg: r.totalQty }));

    res.json({
      crop: out.crop,
      section: out.section,
      next: out.next,         // {year, week, estimateKg,...}
      metrics: out.metrics,   // {r2, rmse, samples}
      points,
      forecastPoint: {
        yw: `${out.next.year}-W${String(out.next.week).padStart(2,"0")}`,
        kg: out.next.estimateKg
      }
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
