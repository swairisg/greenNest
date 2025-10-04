const router = require("express").Router();
const { createBooking,
        listBookings,
        getBookingById, } = require("../../Controllers/customers/visitBookingcontroller");



router.post("/visit-bookings", createBooking);
router.get("/visit-bookings", listBookings);
router.get("/visit-bookings/:id", getBookingById); 


module.exports = router;
