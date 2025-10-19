const SeedBatch = require("../../Model/plantCultivation/SeedBatchModel");
const LandPrep = require("../../Model/plantCultivation/LandPrepModel");
const PlantingPlan = require("../../Model/plantCultivation/PlantingPlanModel"); // you already created earlier
const GrowthLog = require("../../Model/plantCultivation/GrowthLogModel"); // you already created earlier
const Task = require("../../Model/plantCultivation/CultivationTaskModel"); // from tasks page

const onlyDate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

exports.metrics = async (req, res) => {
  try {
    const now = new Date();
    const today = onlyDate(now);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    const since60 = new Date(today);
    since60.setDate(since60.getDate() - 60);

    // --- Seeds: expiring soon + by unit (small example) ---
    const seedsExpiringSoon = await SeedBatch.countDocuments({
      expiryDate: { $gte: today, $lte: in30 },
    });
    const seedsByUnit = await SeedBatch.aggregate([
      { $group: { _id: "$unit", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Land Prep: activity counts (last 60 days) ---
    const landActivity = await LandPrep.aggregate([
      { $match: { date: { $gte: since60, $lte: now } } },
      { $group: { _id: "$activityType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Plans: by section + active plans count (start <= today <= end) ---
    const plansBySection = await PlantingPlan.aggregate([
      { $group: { _id: "$section", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const activePlans = await PlantingPlan.countDocuments({
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    // --- Growth: stage distribution + logs today ---
    const stages = await GrowthLog.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const growthToday = await GrowthLog.countDocuments({
      date: { $gte: today, $lte: new Date(today.getTime() + 86399999) },
    });

    // --- Tasks: status + module + overdue ---
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const tasksByModule = await Task.aggregate([
      { $group: { _id: "$module", count: { $sum: 1 } } },
    ]);
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "done" },
      dueDate: { $lt: today },
    });

    // top 10 soonest due (not done)
    const topTasks = await Task.find({ status: { $ne: "done" } })
      .sort({ dueDate: 1, priority: -1 })
      .limit(10);

    res.json({
      data: {
        seeds: { expiringSoon: seedsExpiringSoon, byUnit: seedsByUnit },
        land: { activity: landActivity },
        plans: { active: activePlans, bySection: plansBySection },
        growth: { stages, today: growthToday },
        tasks: {
          byStatus: tasksByStatus,
          byModule: tasksByModule,
          overdue: overdueTasks,
          top: topTasks,
        },
        generatedAt: now,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to calculate metrics" });
  }
};
