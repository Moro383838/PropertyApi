const mongoose = require("mongoose");
const joi = require("joi");
const jwt = require("jsonwebtoken");
const passwordComplexity = require("joi-password-complexity");
const ToObject = require("es-abstract/5/ToObject");
require("dotenv").config();

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      require: true,
    },
    lastname: {
      type: String,
      require: true,
    },
    password: { type: String, require: true },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    phone: { type: Number, require: true },
    location: {
      city: {
        type: String,
      },
      district: {
        type: String,
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: Object,
      default: {
        url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png",
        publicId: null,
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
UserSchema.virtual("Property", {
  ref: "Property",
  foreignField: "agent",
  localField: "_id",
});
UserSchema.methods.generateToken = function () {
  console.log(process.env.JWT_SECRET);
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SECRET
  );
};
const User = mongoose.model("User", UserSchema);
function validateRegisterUser(obj) {
  const Schema = joi.object({
    firstname: joi.string().required().min(2).max(100),
    lastname: joi.string().required().min(2).max(100),
    email: joi.string().required().min(2).max(100).email(),
    phone: joi.number().required(),
    password: passwordComplexity().required(),
  });
  return Schema.validate(obj);
}
function validateLoginUser(obj) {
  const schema = joi.object({
    email: joi.string().trim().min(5).max(100).required().email().trim(),
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}
function validateUpdateUser(obj) {
  const schema = joi.object({
    firstname: joi.string().trim().min(2).max(100),
    lastname: joi.string().trim().min(2).max(100),
    password: passwordComplexity(),
    email: joi.string().trim().min(2).max(100).email(),
  });
  return schema.validate(obj);
}
module.exports = {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateUpdateUser,
};
