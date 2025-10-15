const express = require("express");
const router = express.Router();
const operationController = require("../../Controllers/climateCheck/OperationController");

router.post("/", operationController.addEvent);
router.get("/", operationController.getEvents);
router.put("/:id", operationController.updateEvent);
router.delete("/", operationController.deleteOldEvents);
router.delete("/:id", operationController.deleteEvent);

module.exports = router;