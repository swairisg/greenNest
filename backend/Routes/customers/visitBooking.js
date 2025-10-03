const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { createBooking, listBookings } = require("../../Controllers/customers/visitBookingcontroller");

const minute = 60 * 1000;
const limiter = rateLimit({
  windowMs: minute,
  max: Number(process.env.VISIT_BOOKING_RATE_PER_MIN || 20),
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/visit-bookings", limiter, createBooking);
router.get("/visit-bookings", listBookings); 

module.exports = router;
