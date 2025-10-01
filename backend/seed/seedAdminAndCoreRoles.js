// backend/seed/seedAdminAndCoreRoles.js
require("dotenv").config();
const mongoose = require("mongoose");

// Models (per your structure)
const { User, EmployeeProfile } = require("../Model/auth");
// Password helper (from earlier)
const { hashPassword } = require("../services/passwordService");

// ---- Config (env with sensible defaults) ----
const MONGO_URI = process.env.MONGO_URI;

const SEEDS = [
  {
    email: process.env.SEED_ADMIN_EMAIL || "admin@greennest.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@1234",
    roles: ["admin"],
    fullName: "Seed Admin",
    department: "Administration",
    designation: "Admin",
  },
  {
    email: process.env.SEED_HR_EMAIL || "hr@greennest.local",
    password: process.env.SEED_HR_PASSWORD || "Hr@1234",
    roles: ["hr_manager"],
    fullName: "Seed HR & Task Manager",
    department: "People Ops",
    designation: "HR & Task Manager",
  },
  {
    email: process.env.SEED_INVENTORY_EMAIL || "inventory@greennest.local",
    password: process.env.SEED_INVENTORY_PASSWORD || "Inventory@1234",
    roles: ["inventory_manager"],
    fullName: "Seed Inventory Manager",
    department: "Operations",
    designation: "Inventory Manager",
  },
  {
    email: process.env.SEED_PRODUCT_EMAIL || "product@greennest.local",
    password: process.env.SEED_PRODUCT_PASSWORD || "Product@1234",
    roles: ["product_manager"],
    fullName: "Seed Product Manager",
    department: "Product",
    designation: "Product Manager",
  },
  {
    email: process.env.SEED_FINANCE_EMAIL || "finance@greennest.local",
    password: process.env.SEED_FINANCE_PASSWORD || "Finance@1234",
    roles: ["finance_manager"],
    fullName: "Seed Finance Manager",
    department: "Finance",
    designation: "Finance Manager",
  },
];

// ---- Seed runner ----
(async () => {
  try {
    if (!MONGO_URI) {
      console.error("❌ MONGO_URI missing in .env");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB:", mongoose.connection.name);

    for (const s of SEEDS) {
      const email = s.email.toLowerCase().trim();
      let user = await User.findOne({ email });

      if (user) {
        console.log(`⏭️  Exists: ${email} (${user.roles.join(",")})`);
        continue;
      }

      const passwordHash = await hashPassword(s.password);

      user = await User.create({
        email,
        passwordHash,
        roles: s.roles,
        primaryRole: s.roles[0],
        status: "active",
        source: "seed",
        isEmailVerified: true,
      });

      await EmployeeProfile.create({
        userId: user._id,
        fullName: s.fullName,
        department: s.department,
        designation: s.designation,
      });

      console.log(`✅ Seeded: ${email} → [${s.roles.join(", ")}]`);
    }

    console.log("🎉 Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
})();
