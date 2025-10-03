const express = require("express");
const harvestRouter = express.Router();

const HarvestController = require("../../Controllers/harvestManagement/HarvestScheduleController");
const HarvestSchedule = require("../../Model/harvestManagement/HarvestScheduleModel");


// Only pass the function reference (not the whole controller object)
harvestRouter.get("/", HarvestController.getAllharvestschedules);
harvestRouter.post("/", HarvestController.addharvestschedules);
harvestRouter.get("/:id", HarvestController.getById);
harvestRouter.put("/:id", HarvestController.updateharvestschedules);
harvestRouter.delete("/:id", HarvestController.deleteharvestschedules);




module.exports = harvestRouter;
