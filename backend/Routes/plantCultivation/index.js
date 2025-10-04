/*const express = require("express");
const { ensureAuth, requireRoles } = require("../../middleware/auth");

// controllers
const seed = require("../../Controllers/plantCultivation/seedController");
const land = require("../../Controllers/plantCultivation/landPrepController");
const cult = require("../../Controllers/plantCultivation/cultivationController");

const router = express.Router();

router.use(ensureAuth, requireRoles(["farmer", "specialist", "admin"]));

/* Seed inventory 
router.get("/seeds", seed.list);
router.post("/seeds", seed.create);
router.get("/seeds/:id", seed.get);
router.patch("/seeds/:id", seed.update);
router.delete("/seeds/:id", seed.remove);

/* Land preparation 
router.get("/land-prep", land.list);
router.post("/land-prep", land.create);
router.get("/land-prep/:id", land.get);
router.patch("/land-prep/:id", land.update);
router.delete("/land-prep/:id", land.remove);

/* Planting plans 
router.get("/plans", cult.listPlans);
router.post("/plans", cult.createPlan);
router.get("/plans/:id", cult.getPlan);
router.patch("/plans/:id", cult.updatePlan);
router.delete("/plans/:id", cult.removePlan);

/* Growth logs under a plan 
router.get("/plans/:planId/logs", cult.listLogs);
router.post("/plans/:planId/logs", cult.addLog);
router.patch("/plans/:planId/logs/:logId", cult.updateLog);
router.delete("/plans/:planId/logs/:logId", cult.removeLog);

module.exports = router;*/

const express = require("express");
const { ensureAuth, requireRoles } = require("../../middleware/auth");

const seed = require("../../Controllers/plantCultivation/seedController");

const router = express.Router();

// Guard: farmer/specialist/admin
router.use(ensureAuth, requireRoles(["farmer", "specialist", "admin"]));

/* ---- Seed inventory (CRUD) ---- */
router.get("/seeds", seed.list);
router.post("/seeds", seed.create);
router.get("/seeds/:id", seed.get);
router.patch("/seeds/:id", seed.update);
router.delete("/seeds/:id", seed.remove);

module.exports = router;
