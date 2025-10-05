const asyncHandler = require("express-async-handler");
const { validateBooking, Booking } = require("../Models/Booking");
const { Property } = require("../Models/Property");
const { message } = require("statuses");

module.exports.CreateBookingCtrl = asyncHandler(async (req, res) => {
  const { error } = validateBooking(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (req.body.type === "rent") {
    const overlap = await Booking.findOne({
      property: req.body.property,
      type: "rent",
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          startDate: { $lte: req.body.endDate },
          endDate: { $gte: req.body.startDate },
        },
      ],
    });

    if (overlap) {
      return res
        .status(400)
        .json({ message: "Property already booked in this period" });
    }
  }
  const booking = new Booking({
    property: req.body.property,
    user: req.user.id,
    type: req.body.type,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    bookedPrice: req.body.bookedPrice,
  });

  await booking.save();

  res.status(201).json(booking);
});
module.exports.updateBookingStatusCtrl = asyncHandler(async (req, res) => {
  const { id: bookingId } = req.params;
  console.log(bookingId);
  const { status } = req.body;
  const allowedStatuses = ["pending", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const property = await Property.findById(booking.property);
  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (
    req.user.id === booking.user.toString() ||
    req.user.id === property.agent.toString()
  ) {
    booking.status = status;
    await booking.save();
    return res.status(200).json(booking);
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }
});

module.exports.getAllBooking = asyncHandler(async (req, res) => {
  const pageNum = req.query.pageNum * 1;
  console.log(pageNum);
  if (pageNum) {
    const limit = 10;
    const skip = (pageNum - 1) * limit;
    const books = await Booking.find().skip(skip).limit(limit);
    res.status(200).json(books);
  } else {
    const books = await Booking.find();
    res.status(200).json(books);
  }
});

exports.getBookingStats = asyncHandler(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        totalBookings: { $sum: 1 },
        totalAmount: { $sum: "$bookedPrice" },
      },
    },
  ]);

  const monthly = await Booking.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalBookings: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.status(200).json({ byStatus: stats, byMonth: monthly });
});

module.exports.DeleteAllBooking = asyncHandler(async (req, res) => {
  await Booking.deleteMany();
  res.status(203).json({ message: "all books has been deleted" });
});

module.exports.getMyBooks = asyncHandler(async (req, res) => {
  const books = await Booking.find({ user: req.user.id });
  res.status(200).json(books);
});

module.exports.AcceptBookCtrl = asyncHandler(async (req, res) => {
  const book = await Booking.findById(req.params.id);
  if (!book) return res.status(404).json({ message: " not found" });

  const property = await Property.findById(book.property);
  if (req.user.id === property.agent.toString()) {
    property.isPurchased = true;
    await property.save();
  }
  res.status(201).json(property);
});


