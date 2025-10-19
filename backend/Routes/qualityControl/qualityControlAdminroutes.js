// backend/Routes/qualityControl/qualityControlAdminRoutes.js
const express = require("express");
const r = express.Router();
const admin = require("../../Controllers/qualityControl/qualityControllersadmin");

r.get("/quality", admin.listAll);
r.get("/quality/:itemId", admin.getById);
r.patch("/quality/:itemId", admin.updateDetails);
r.patch("/quality/:itemId/grade", admin.updateGrading); // <-- add this
r.delete("/quality/:itemId", admin.removeAny);

module.exports = r;