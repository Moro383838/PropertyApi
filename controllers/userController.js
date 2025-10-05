const { User, validateUpdateUser } = require("../Models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const path = require("path");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");
const fs = require("fs");

/**
 *  @desc    Update User
 *  @route   /api/users/:id
 *  @method  PUT
 *  @access  private (only admin & user himself)
 */
module.exports.UpdateUserCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password,
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(updatedUser);
});
module.exports.getAllUsers = asyncHandler(async (req, res) => {
  const pagenum = req.query.pagenum;
  if (pagenum) {
    const limit = 5;
    skip = (pagenum - 1) * limit;
    const users = await User.find().skip(skip).limit(limit).select("-password");
    res.status(200).json(users);
  } else {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  }
});
module.exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id ).populate(
    "Property"
  ).select(["image title"]);
  if (user) res.status(200).json(user);
  else return res.status(404).json({ message: "user not found" });
});
module.exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete({ _id: req.params, id });
  if (user) res.status(200).json({ message: "user has been removed" });
  else return res.status(404).json({ message: "user not found" });
});

module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(404).json({ message: "no file provided" });
  }
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  const user = await User.findById(req.user.id);

  if (user.profilePhoto?.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();
  res.status(200).json({
    message: "your profile photo uploaded successfully",
    profilePhoto: { url: result.secure_url, publicId: result.public_id },
  });
  fs.unlinkSync(imagePath);
});
