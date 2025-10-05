// backend/scripts/fixEmployeeProfiles.js
require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("../Model/tasksHR/EmployeeProfile");

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI missing in .env");

    await mongoose.connect(uri);
    console.log("✅ Connected:", mongoose.connection.name);

    // --- 1) Remove profiles without a userId (legacy test data)
    const rm = await Employee.deleteMany({
      $or: [{ userId: null }, { userId: { $exists: false } }],
    });
    console.log("Removed profiles with no userId:", rm.deletedCount);

    // --- 2) Dedupe by userId (keep newest, delete the rest)
    const dups = await Employee.aggregate([
      {
        $group: { _id: "$userId", ids: { $push: "$_id" }, count: { $sum: 1 } },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    let totalRemoved = 0;
    for (const g of dups) {
      const docs = await Employee.find({ _id: { $in: g.ids } })
        .sort({ createdAt: -1 })
        .select("_id createdAt")
        .lean();

      const keepId = docs[0]._id; // newest
      const removeIds = docs.slice(1).map((d) => d._id);
      if (removeIds.length) {
        const r = await Employee.deleteMany({ _id: { $in: removeIds } });
        totalRemoved += r.deletedCount || 0;
        console.log(
          `userId=${g._id}: kept ${keepId}, removed ${r.deletedCount}`
        );
      }
    }
    console.log("Total duplicates removed:", totalRemoved);

    // --- 3) Rebuild the unique index on userId (in case an old non-unique exists)
    try {
      await Employee.collection.dropIndex("userId_1");
      console.log("Dropped old index userId_1");
    } catch (e) {
      // ignore if it didn't exist
    }
    await Employee.collection.createIndex(
      { userId: 1 },
      { unique: true, name: "userId_1" }
    );
    console.log("✅ Ensured UNIQUE index on userId");

    // --- 4) Ensure the text index (for search) exists
    try {
      await Employee.collection.createIndex(
        { fullName: "text", department: "text", designation: "text" },
        { name: "employee_text_idx" }
      );
      console.log("✅ Ensured text index employee_text_idx");
    } catch (e) {
      console.log("Text index already exists");
    }

    console.log("🎉 Cleanup done");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup error:", err);
    process.exit(1);
  }
})();
