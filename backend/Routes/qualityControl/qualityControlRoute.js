const express = require("express");
const router =  express.Router();

//instert model
//const quality = require("../Model/qualityControl/qualityControlmodel");
//insert controller
const qualityControl = require("../../Controllers/qualityControl/qualityControllers");

router.post("/",qualityControl.addQuality);
router.get("/",qualityControl.getAllUsers);
router.get("/:itemId",qualityControl.getById);
router.put("/:itemId",qualityControl.updateItem);
router.delete("/:itemId",qualityControl.deleteItem);

module.exports = router;
