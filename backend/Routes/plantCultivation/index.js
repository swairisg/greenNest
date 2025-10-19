const express = require("express");
const { ensureAuth, requireRoles } = require("../../middleware/auth");

const seed = require("../../Controllers/plantCultivation/seedController");
const land = require("../../Controllers/plantCultivation/landPrepController");
const plan = require("../../Controllers/plantCultivation/planController");
const growth = require("../../Controllers/plantCultivation/growthController");
const analytics = require("../../Controllers/plantCultivation/analyticsController");
const phenology = require("../../Controllers/plantCultivation/phenologyController");

const router = express.Router();

// Guard: farmer/specialist/admin
router.use(ensureAuth, requireRoles(["farmer", "specialist", "admin"]));

/*Seed inventory */
router.get("/seeds", seed.list);
router.post("/seeds", seed.create);
router.get("/seeds/:id", seed.get);
router.patch("/seeds/:id", seed.update);
router.delete("/seeds/:id", seed.remove);

// Land Preparation
router.get("/land-prep", land.list);
router.post("/land-prep", land.create);
router.get("/land-prep/:id", land.get);
router.patch("/land-prep/:id", land.update);
router.delete("/land-prep/:id", land.remove);

/* Plans */
router.get("/plans", plan.list);
router.post("/plans", plan.create);
router.get("/plans/:id", plan.get);
router.patch("/plans/:id", plan.update);
router.delete("/plans/:id", plan.remove);

/* Growth logs */
router.get("/plans/:planId/logs", growth.list);
router.post("/plans/:planId/logs", growth.create);
router.get("/plans/:planId/logs/:logId", growth.get);
router.patch("/plans/:planId/logs/:logId", growth.update);
router.delete("/plans/:planId/logs/:logId", growth.remove);

router.get("/metrics", analytics.metrics);

// Phenology & Autopilot
router.get("/phenology/summary", phenology.summary);
router.post("/phenology/recompute", phenology.recomputeAll);
router.get("/phenology/:planId", phenology.forPlan);

module.exports = router;
