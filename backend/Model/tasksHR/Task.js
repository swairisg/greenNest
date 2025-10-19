// backend/Model/tasksHR/Task.js
const mongoose = require("mongoose");
const EmployeeProfile = require("../tasksHR/EmployeeProfile"); // adjust path if needed

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },

    // enums to match UI
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "blocked", "done"],
      default: "open",
      index: true,
    },

    dueDate: { type: Date },
    completedAt: { type: Date, default: null },

    // who it is assigned to
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      index: true,
      default: null,
    },

    // denormalized for filtering/export
    department: { type: String, trim: true, index: true },

    // soft delete
    isDeleted: { type: Boolean, default: false, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// text index for search (title/description)
TaskSchema.index({ title: "text", description: "text" });

/** Helper: set department from assignee's EmployeeProfile */
async function setDepartmentFromAssignee(docOrUpdate) {
  const assigneeId = docOrUpdate.assignee;
  if (!assigneeId) {
    // if explicitly cleared, also clear department
    if ("assignee" in docOrUpdate) docOrUpdate.department = undefined;
    return;
  }
  try {
    const emp = await EmployeeProfile.findById(assigneeId)
      .select("department")
      .lean();
    if (emp) docOrUpdate.department = emp.department || undefined;
  } catch {
    /* ignore lookup errors */
  }
}

/** Pre-save: keep department synced; auto-stamp completedAt on done */
TaskSchema.pre("save", async function (next) {
  try {
    if (this.isModified("assignee") || (this.isNew && this.assignee)) {
      await setDepartmentFromAssignee(this);
    }
    if (
      this.isModified("status") &&
      this.status === "done" &&
      !this.completedAt
    ) {
      this.completedAt = new Date();
    }
    next();
  } catch (e) {
    next(e);
  }
});

/** Pre findOneAndUpdate: same syncing + auto-stamp */
TaskSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() || {};
    // handle $set style updates too
    const setObj = update.$set || update;

    if (setObj && Object.prototype.hasOwnProperty.call(setObj, "assignee")) {
      await setDepartmentFromAssignee(setObj);
      // ensure the update object reflects changes
      if (update.$set) update.$set = setObj;
      else this.setUpdate(setObj);
    }

    const statusVal =
      (update.$set && update.$set.status) || update.status || undefined;
    const hasCompletedAt =
      (update.$set &&
        Object.prototype.hasOwnProperty.call(update.$set, "completedAt")) ||
      Object.prototype.hasOwnProperty.call(update, "completedAt");

    if (statusVal === "done" && !hasCompletedAt) {
      if (update.$set) update.$set.completedAt = new Date();
      else update.completedAt = new Date();
      this.setUpdate(update);
    }

    next();
  } catch (e) {
    next(e);
  }
});

module.exports = mongoose.models.Task || mongoose.model("Task", TaskSchema);
