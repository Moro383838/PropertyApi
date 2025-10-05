const mongoose = require("mongoose");
const Joi = require("joi");
const BookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["rent", "sale"],
      required: true,
    },
    startDate: {
      type: Date,
      required: function () {
        return this.type == "rent";
      },
    },
    endDate: {
      type: Date,
      required: function () {
        return this.type == "rent";
      },
    },
    bookedPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

BookingSchema.index(
  { property: 1 },
  { unique: true, partialFilterExpression: { type: "sale" } }
);

const Booking = mongoose.model("Booking", BookingSchema);

function validateBooking(obj) {
  return Joi.object({
    property: Joi.string().required(),
    type: Joi.string().valid("rent", "sale").required(),
    startDate: Joi.date().when("type", {
      is: "rent",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    endDate: Joi.date().when("type", {
      is: "rent",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    bookedPrice: Joi.number().required(),
  }).validate(obj);
}
module.exports = { Booking, validateBooking };
