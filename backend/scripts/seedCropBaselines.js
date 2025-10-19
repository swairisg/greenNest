// backend/scripts/seedCropBaselines.js
require("dotenv").config();
const mongoose = require("mongoose");

const Crop = require("../Model/plantCultivation/CropModel"); // adjust path if needed

(async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);

  // Add or update baselines here (names must match your seedBatch.cropType)
  const docs = [
    {
      name: "Strawberry",
      baseTemp: 7,
      stageGDD: {
        emergence: 120,
        vegetative: 400,
        flowering: 800,
        fruiting: 1200,
      },
    },
    {
      name: "Rose",
      baseTemp: 10,
      stageGDD: {
        emergence: 150,
        vegetative: 500,
        flowering: 900,
        fruiting: 0,
      }, // fruiting 0 if N/A
    },
    {
      name: "Carrot",
      baseTemp: 5,
      stageGDD: { emergence: 90, vegetative: 350, flowering: 700, fruiting: 0 },
    },
  ];

  for (const d of docs) {
    await Crop.updateOne(
      { name: new RegExp(`^${d.name}$`, "i") },
      { $set: d },
      { upsert: true }
    );
    console.log(`Upserted baseline: ${d.name}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
})();
