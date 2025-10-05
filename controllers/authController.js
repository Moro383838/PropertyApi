const {
  User,
  validateRegisterUser,
  validateUpdateUser,
  validateLoginUser,
} = require("../Models/User");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const { message } = require("statuses");
module.exports.RegisterCtrl = asyncHandler(async (req, res) => {
  const { error } = validateRegisterUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ message: "email is used" });
  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);
  user = new User({
    firstname: req.body.firstname,
    email: req.body.email,
    lastname: req.body.lastname,
    phone: req.body.phone,
    password: req.body.password,
  });
  await user.save();
  const result = await user.save();
  const token = user.generateToken();

  const { password, ...other } = result._doc;

  res.status(201).json({ ...other, token });
});

module.exports.LoginCtrl = asyncHandler(async (req, res) => {
  const { error } = validateLoginUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ message: "user not found" });

  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!isPasswordMatch) {
    return res.status(400).json({ message: "invalid email or password" });
  }
  const token = user.generateToken();

  const { password, ...other } = user._doc;

  res.status(200).json({ ...other, token });
});
