const express = require("express");
const { ensureAuth, requireRoles } = require("../../middleware/auth");

const seed = require("../../Controllers/plantCultivation/seedController");
const plan = require("../../Controllers/plantCultivation/planController");
const growth = require("../../Controllers/plantCultivation/growthController");

const router = express.Router();

// Guard: farmer/specialist/admin
router.use(ensureAuth, requireRoles(["farmer", "specialist", "admin"]));

/*Seed inventory */
router.get("/seeds", seed.list);
router.post("/seeds", seed.create);
router.get("/seeds/:id", seed.get);
router.patch("/seeds/:id", seed.update);
router.delete("/seeds/:id", seed.remove);

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

module.exports = router;
