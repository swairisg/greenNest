// backend/seed/seedAdminAndCoreRoles.js
require("dotenv").config();
const mongoose = require("mongoose");

// Models (per your structure)
const { User, EmployeeProfile } = require("../Model/auth");
// Password helper
const { hashPassword } = require("../services/passwordService");

// ---- Config ----
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
  {
    email: process.env.SEED_FARMER_EMAIL || "farmer@greennest.local",
    password: process.env.SEED_FARMER_PASSWORD || "Farmer@1234",
    roles: ["farmer"],
    fullName: "Seed Farmer",
    department: "Greenhouse",
    designation: "Farmer",
  },
  {
    email: process.env.SEED_AGRO_EMAIL || "agro@greennest.local",
    password: process.env.SEED_AGRO_PASSWORD || "Agro@1234",
    roles: ["specialist"],
    fullName: "Seed Agro Specialist",
    department: "Greenhouse",
    designation: "Agro Specialist",
  },
];

(async () => {
  try {
    if (!MONGO_URI) {
      console.error("❌ MONGO_URI missing in .env");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB:", mongoose.connection.name);

    // Ensure indexes exist first
    try {
      await User.syncIndexes();
      await EmployeeProfile.syncIndexes();
      console.log("🧭 Indexes synced (User, EmployeeProfile)");
    } catch (e) {
      console.warn("⚠️ Index sync warning:", e?.message || e);
    }

    for (const s of SEEDS) {
      const email = s.email.toLowerCase().trim();

      // 1) USER: upsert without touching password if user already exists
      let user = await User.findOne({ email });

      if (!user) {
        // create brand-new user
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
        console.log(`👤 Created user: ${email} → [${s.roles.join(", ")}]`);
      } else {
        // ensure roles contain seed roles (no duplicates)
        const currentRoles = new Set(user.roles || []);
        for (const r of s.roles) currentRoles.add(r);

        const updates = { roles: Array.from(currentRoles) };

        // set primaryRole if missing
        if (!user.primaryRole) updates.primaryRole = s.roles[0];

        // Do not overwrite passwordHash or email verification here
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id).lean();

        console.log(
          `↺ Updated user roles: ${email} → [${user.roles.join(", ")}]`
        );
      }

      // 2) EMPLOYEE PROFILE: create or refresh (idempotent)
      const exists = await EmployeeProfile.findOne({ userId: user._id });

      if (!exists) {
        await EmployeeProfile.create({
          userId: user._id,
          fullName: s.fullName,
          department: s.department,
          designation: s.designation,
          // you can also set defaults for joinDate/currentStatus/salary later if you add them to seeds
        });
        console.log(`🗂️  Created profile for: ${email}`);
      } else {
        // optional refresh of visible fields
        await EmployeeProfile.updateOne(
          { _id: exists._id },
          {
            $set: {
              fullName: s.fullName,
              department: s.department,
              designation: s.designation,
            },
          }
        );
        console.log(`🛠️  Updated profile for: ${email}`);
      }
    }

    console.log("🎉 Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
})();
