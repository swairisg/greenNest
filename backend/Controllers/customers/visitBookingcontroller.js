const VisitBooking = require("../../Model/customers/VisitBookingModel");


function isPastDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return true;
  const today = new Date(); today.setHours(0,0,0,0);
  const onlyDay = new Date(dt); onlyDay.setHours(0,0,0,0);
  return onlyDay < today;
}

const isPhone = (v = "") => /^[+()\-.\s\d]{7,20}$/.test(String(v));

const SLOT_OPTIONS = [
  "09:00-10:00","10:00-11:00","11:00-12:00",
  "13:00-14:00","14:00-15:00","15:00-16:00"
];

const isEmail = (v="") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));

function validateBooking(payload) {
  const errs = [];
  const {
    fullName, email, phone, preferredDate,
    timeSlot, visitorsCount, purpose, agreeToTerms
  } = payload;

  if (!fullName || String(fullName).trim().length < 2) errs.push("Full name is required (min 2 chars).");
  if (!isEmail(email)) errs.push("Valid email is required.");
  if (!isPhone(phone)) errs.push("Valid phone number is required.");
  if (!preferredDate) errs.push("Preferred date is required.");
  else if (isPastDate(preferredDate)) errs.push("Preferred date cannot be in the past.");

  if (!timeSlot || !SLOT_OPTIONS.includes(timeSlot)) errs.push("Please select a valid time slot.");
  const count = Number(visitorsCount);
  if (!Number.isInteger(count) || count < 1 || count > 20) errs.push("Visitors count must be between 1 and 20.");

  if (purpose && String(purpose).length > 300) errs.push("Purpose must be 300 characters or less.");
  if (agreeToTerms !== true) errs.push("You must accept the terms.");

  return errs;
}

exports.createBooking = async (req, res) => {
  try {
    const payload = req.body;

    if (payload.website && String(payload.website).trim()) {
      return res.status(200).json({ ok: true });
    }

    const errors = validateBooking(payload);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const doc = await VisitBooking.create({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      preferredDate: payload.preferredDate,
      timeSlot: payload.timeSlot,
      visitorsCount: Number(payload.visitorsCount),
      purpose: payload.purpose || "",
      agreeToTerms: true,
    });

    return res.status(201).json({ data: doc, message: "Booking submitted" });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.listBookings = async (req, res) => {
  const filter = {};
  if (req.query.email) filter.email = String(req.query.email).trim();

  const list = await VisitBooking.find(filter).sort({ createdAt: -1 }).limit(200);
  return res.json({ data: list });
};

// 👇 NEW: fetch one booking by id (for a simple details view if needed)
exports.getBookingById = async (req, res) => {
  try {
    const doc = await VisitBooking.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Booking not found" });
    return res.json({ data: doc });
  } catch (err) {
    console.error("getBookingById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}