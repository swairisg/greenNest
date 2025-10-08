// backend/services/tasksHR/shifts.service.js
const { ShiftTemplate } = require("../../Model/tasksHR");

module.exports = {
  async listTemplates() {
    return ShiftTemplate.find({}).sort({ createdAt: -1 }).lean();
  },

  async createTemplate(data) {
    // data: { name, startTime, endTime, graceMinutes, overtimeRules? }
    const doc = await ShiftTemplate.create(data);
    return doc.toObject();
  },

  async updateTemplate(id, patch) {
    const doc = await ShiftTemplate.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();
    return doc;
  },

  async deleteTemplate(id) {
    await ShiftTemplate.findByIdAndDelete(id);
    return { ok: true };
  },

  async listHolidays() {
    // If you later add a Holiday model, replace this
    return [];
  },
};
