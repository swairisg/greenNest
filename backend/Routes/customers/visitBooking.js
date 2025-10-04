const router = require("express").Router();
const {
  createBooking,
  listBookings,
  getBookingById,
  updateBooking,
  approveBooking,
  deleteBooking,
} = require("../../Controllers/customers/visitBookingcontroller");

// Public create/list (adjust auth as you like)
router.post("/visit-bookings", createBooking);
router.get("/visit-bookings", listBookings);
router.get("/visit-bookings/:id", getBookingById);

// Admin actions (protect with your auth/role middleware if needed)
// Update (generic)
router.patch("/visit-bookings/:id", updateBooking);
// Approve (shortcut)
router.post("/visit-bookings/:id/approve", approveBooking);
// Delete
router.delete("/visit-bookings/:id", deleteBooking);

module.exports = router;
