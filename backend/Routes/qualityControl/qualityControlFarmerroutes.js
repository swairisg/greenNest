// backend/Routes/qualityControl/qualityControlFarmerroutes.js
const express = require("express");
const r = express.Router();
const farmer = require("../../Controllers/qualityControl/qualityControllersfarmer");

// assuming your login flow already ensures req.user is the farmer
r.post("/quality", farmer.createMine);         // POST /api/farmer/quality
r.get("/quality", farmer.listMine);            // GET  /api/farmer/quality
r.delete("/quality/:itemId", farmer.removeMine); // DELETE /api/farmer/quality/:itemId
r.get("/quality/:itemId", farmer.getMineById);

module.exports = r;