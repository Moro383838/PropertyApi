const asyncHandler = require("express-async-handler");
const {
  Property,
  validateCreateProperty,
  validateUpdateProperty,
} = require("../Models/Property");
const { User } = require("../Models/User");
const {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
} = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");
const { Booking } = require("../Models/Booking");
module.exports.CreatePropertyCtrl = asyncHandler(async (req, res) => {
  // 1. Validate inputs
  const { error } = validateCreateProperty(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // 2. Check if image is provided
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an image" });
  }

  // 3. Upload image to cloudinary
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const img = await cloudinaryUploadImage(imagePath);

  // 4. Create property
  const property = new Property({
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    location: req.body.location,
    bedrooms: req.body.bedrooms,
    bathrooms: req.body.bathrooms,
    area: req.body.area,
    image: {
      url: img.secure_url,
      publicId: img.public_id,
    },
    type: req.body.type,
    status: req.body.status,
    agent: req.user.id,
  });

  // 5. Save in DB
  const result = await property.save();

  // 6. Remove local file
  fs.unlinkSync(imagePath);

  res.status(201).json(result);
});

module.exports.GetAllPropertiesCtrl = asyncHandler(async (req, res) => {
  const { minPrice, maxPrice, area, bathrooms } = req.query;

  let query = {};

  if (minPrice && maxPrice) {
    query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
  } else if (minPrice) {
    query.price = { $gte: Number(minPrice) };
  } else if (maxPrice) {
    query.price = { $lte: Number(maxPrice) };
  }

  if (area) {
    query.area = { $gte: Number(area) };
  }

  if (bathrooms) {
    query.bathrooms = Number(bathrooms);
  }

  const properties = await Property.find(query)
    .populate("agent", ["firstname", "lastname", "email", "phone"])
    .sort({ createdAt: -1 });

  res.status(200).json(properties);
});

module.exports.GetPropertyByIdCtrl = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate("agent", [
    "firstname",
    "lastname",
    "email",
    "phone",
  ]);
  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }
  property.viewsCount = property.viewsCount + 1;
  await property.save();
  res.status(200).json(property);
});

module.exports.UpdatePropertyCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateProperty(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (req.user.id !== property.agent.toString() && !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Access denied, only owner or admin can update" });
  }

  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        location: req.body.location,
        bedrooms: req.body.bedrooms,
        bathrooms: req.body.bathrooms,
        area: req.body.area,
        image: req.body.image,
        type: req.body.type,
        status: req.body.status,
      },
    },
    { new: true }
  ).populate("agent", ["firstname", "lastname", "email", "phone"]);

  res.status(200).json(updatedProperty);
});

/**
 * @desc    Delete Property
 * @route   /api/properties/:id
 * @method  DELETE
 * @access  private (only owner of the property or admin)
 */
module.exports.DeletePropertyCtrl = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (req.user.id !== property.agent.toString() && !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Access denied, only owner or admin can delete" });
  }

  await Property.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Property has been deleted successfully" });
});

module.exports.updatePropertyImageCtrl = asyncHandler(async (req, res) => {
  // 1. Validation
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }

  // 2. Get the post from DB and check if post exist
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: "post not found" });
  }

  // 3. Check if this post belong to logged in user
  if (req.user.id !== property.agent.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }

  // 4. Delete the old image
  if (property.image.publicId)
    await cloudinaryRemoveImage(property.image.publicId);

  // 5. Upload new photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  // 6. Update the image field in the db
  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );
  res.status(201).json(updatedProperty);
  fs.unlinkSync(imagePath);
});

module.exports.ChipCtrl = asyncHandler(async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ message: "City is required" });
  }
  const properties = await Property.find({ "location.city": city })
    .sort({ price: 1 })
    .limit(5)
    .populate("agent", ["firstname", "lastname", "email", "phone"]);

  res.status(200).json(properties);
});
module.exports.GetAvgPricePerCityCtrl = asyncHandler(async (req, res) => {
  const stats = await Property.aggregate([
    {
      $group: {
        _id: "$location.city",
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        totalProperties: { $sum: 1 },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json(stats);
});

module.exports.toggleLikes = asyncHandler(async (req, res) => {
  const userlogged = req.user.id;
  const { id: propertyId } = req.params;
  console.log(propertyId, req.params.id);
  let property = await Property.findById(propertyId);
  if (!property) return res.status(404).json({ message: "property not found" });
  const isAlreadyLogged = property.likes.find(
    (user) => user.toString() === userlogged
  );
  if (isAlreadyLogged) {
    property = await Property.findByIdAndUpdate(
      propertyId,
      {
        $pull: { likes: userlogged },
      },
      { new: true }
    );
  } else {
    property = await Property.findByIdAndUpdate(
      propertyId,
      {
        $push: { likes: userlogged },
      },
      { new: true }
    );
  }

  res.status(200).json(property);
});

// أرخص 10 عقارات
exports.getCheapestProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().sort({ price: 1 }).limit(10);

  res.status(200).json(properties);
});

// أغلى 10 عقارات
exports.getMostExpensiveProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().sort({ price: -1 }).limit(10);

  res.status(200).json(properties);
});

module.exports.getAvailableProperties = asyncHandler(async (req, res) => {
  const bookedIds = await Booking.find({
    status: { $in: ["pending", "confirmed", "completed"] },
  }).distinct("property");

  const available = await Property.find({
    _id: { $nin: bookedIds },
    status: { $in: ["for_sale", "for_rent"] },
  }).sort({ createdAt: -1 });

  res.status(200).json(available);
});
const mongoose = require("mongoose");

module.exports.getMyPropertyBookings = asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const agentObjectId = new mongoose.Types.ObjectId(agentId);
  const myProperties = await Property.find({ agent: agentObjectId }).select("_id");


  if (myProperties.length === 0) {
    return res.status(404).json({ message: "You have no properties yet." });
  }

  const bookings = await Booking.find({
    property: { $in: myProperties.map((p) => p._id) },
  })
    .populate("property", ["title", "price", "location"])
    .populate("user", ["firstname", "lastname", "email", "phone"])
    .sort({ createdAt: -1 });

  if (bookings.length === 0) {
    return res.status(404).json({ message: "No bookings for your properties yet." });
  }

  res.status(200).json(bookings);
});


