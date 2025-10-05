const {
  CreateBookingCtrl,
  updateBookingStatusCtrl,
  getAllBooking,
  getBookingStats,
  getMyBooks,
  getMyPropertyBookings,
} = require("../controllers/BookingController");
const {
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middleware/verifyToken");


const router = require("express").Router();


router.get("/my", verifyToken, getMyBooks);


router.get("/state", verifyTokenAndAdmin, getBookingStats);

router
.route("/")
.post(verifyToken, CreateBookingCtrl)
.get(verifyTokenAndAdmin, getAllBooking);
router.route("/:id").put(verifyToken, updateBookingStatusCtrl);

module.exports = router;
