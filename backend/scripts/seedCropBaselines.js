// backend/scripts/seedCropBaselines.js
require("dotenv").config();
const mongoose = require("mongoose");

const Crop = require("../Model/plantCultivation/CropModel");

(async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error(" Missing MONGO_URI in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(" Connected to MongoDB");

    const docs = [
      // Fruits / berries
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
        name: "Tomato",
        baseTemp: 10,
        stageGDD: {
          emergence: 100,
          vegetative: 450,
          flowering: 800,
          fruiting: 1200,
        },
      },
      {
        name: "Cucumber",
        baseTemp: 10,
        stageGDD: {
          emergence: 90,
          vegetative: 400,
          flowering: 750,
          fruiting: 1050,
        },
      },
      {
        name: "Bell Pepper",
        baseTemp: 11,
        stageGDD: {
          emergence: 110,
          vegetative: 500,
          flowering: 850,
          fruiting: 1250,
        },
      },

      // Leafy
      {
        name: "Lettuce",
        baseTemp: 5,
        stageGDD: { emergence: 80, vegetative: 300, flowering: 0, fruiting: 0 },
      },
      {
        name: "Spinach",
        baseTemp: 5,
        stageGDD: { emergence: 70, vegetative: 280, flowering: 0, fruiting: 0 },
      },
      {
        name: "Cabbage",
        baseTemp: 5,
        stageGDD: {
          emergence: 90,
          vegetative: 360,
          flowering: 720,
          fruiting: 0,
        },
      },

      // Brassicas
      {
        name: "Broccoli",
        baseTemp: 6,
        stageGDD: {
          emergence: 90,
          vegetative: 350,
          flowering: 700,
          fruiting: 0,
        },
      },
      {
        name: "Cauliflower",
        baseTemp: 6,
        stageGDD: {
          emergence: 90,
          vegetative: 360,
          flowering: 720,
          fruiting: 0,
        },
      },

      // Roots
      {
        name: "Carrot",
        baseTemp: 5,
        stageGDD: {
          emergence: 90,
          vegetative: 350,
          flowering: 700,
          fruiting: 0,
        },
      },

      // Ornamentals
      {
        name: "Rose",
        baseTemp: 10,
        stageGDD: {
          emergence: 150,
          vegetative: 500,
          flowering: 900,
          fruiting: 0,
        },
      },
      {
        name: "Gerbera",
        baseTemp: 10,
        stageGDD: {
          emergence: 120,
          vegetative: 450,
          flowering: 850,
          fruiting: 0,
        },
      },
      {
        name: "Chrysanthemum",
        baseTemp: 8,
        stageGDD: {
          emergence: 120,
          vegetative: 480,
          flowering: 850,
          fruiting: 0,
        },
      },
    ];

    let upserts = 0;
    for (const d of docs) {
      await Crop.updateOne(
        { name: new RegExp(`^${d.name}$`, "i") }, // case-insensitive match
        { $set: d },
        { upsert: true }
      );
      console.log(`⬆️  Upserted baseline: ${d.name}`);
      upserts++;
    }

    console.log(` Done. ${upserts} crop baselines upserted/updated.`);
  } catch (err) {
    console.error("Seed error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
})();
