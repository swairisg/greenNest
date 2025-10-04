const router = require("express").Router();
const {
  createBooking,
  listBookings,
  getBookingById,
  updateBooking,
  approveBooking,
  deleteBooking,
} = require("../../Controllers/customers/visitBookingcontroller");

router.post("/visit-bookings", createBooking);
router.get("/visit-bookings", listBookings);
router.get("/visit-bookings/:id", getBookingById);

router.patch("/visit-bookings/:id", updateBooking);
router.post("/visit-bookings/:id/approve", approveBooking);
router.delete("/visit-bookings/:id", deleteBooking);

module.exports = router;
