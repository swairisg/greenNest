const express = require("express");
const router = express.Router();
const operationController = require("../controllers/OperationController");

router.post("/", operationController.addEvent);
router.get("/", operationController.getEvents);
router.put("/:id", operationController.updateEvent);
router.delete("/", operationController.deleteOldEvents);

module.exports = router;