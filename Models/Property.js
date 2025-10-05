const mongoose = require("mongoose");
const Joi = require("joi");

const PropertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      district: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    bedrooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    area: {
      type: Number,
      required: true,
      min: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    image: {
      url: { type: String },
      publicId: String,
    },

    type: {
      type: String,
      enum: ["villa", "apartment", "land", "commercial", "other"],
      default: "apartment",
    },
    status: {
      type: String,

      default: "for_sale",
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Validation
function validateCreateProperty(obj) {
  const schema = Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().min(10).required(),
    price: Joi.number().min(0).required(),
    location: Joi.object({
      city: Joi.string().trim().required(),
      district: Joi.string().trim().allow(""),
      address: Joi.string().trim().allow(""),
    }).required(),
    bedrooms: Joi.number().min(0),
    bathrooms: Joi.number().min(0),
    area: Joi.number().min(0).required(),
    type: Joi.string().valid(
      "villa",
      "apartment",
      "land",
      "commercial",
      "other"
    ),
    status: Joi.string(),
  });
  return schema.validate(obj);
}

function validateUpdateProperty(obj) {
  const schema = Joi.object({
    title: Joi.string().trim().min(3).max(200),
    description: Joi.string().trim().min(10),
    price: Joi.number().min(0),
    location: Joi.object({
      city: Joi.string().trim(),
      district: Joi.string().trim().allow(""),
      address: Joi.string().trim().allow(""),
    }),
    bedrooms: Joi.number().min(0),
    bathrooms: Joi.number().min(0),
    area: Joi.number().min(0),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        publicId: Joi.string().allow(""),
      })
    ),
    type: Joi.string().valid(
      "villa",
      "apartment",
      "land",
      "commercial",
      "other"
    ),
    status: Joi.string(),
  });
  return schema.validate(obj);
}

const Property = mongoose.model("Property", PropertySchema);

module.exports = {
  Property,
  validateCreateProperty,
  validateUpdateProperty,
};
