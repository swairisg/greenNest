const express = require("express");
const router = express.Router();

const UserController = require("../../Controllers/pestControl/PestDetectControllers");

router.get("/",UserController.getAllUsers);
router.post("/",UserController.addUsers);
router.get("/:id",UserController.getByID);
router.put("/:id",UserController.updateUser);
router.delete("/:id",UserController.deleteUser);

//export
module.exports = router;