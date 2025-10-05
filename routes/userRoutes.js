const express = require("express");
const {
  getAllUsers,
  UpdateUserCtrl,
  getUserById,
  deleteUser,
  profilePhotoUploadCtrl,
} = require("../controllers/userController");
const router = express.Router();
const {
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middleware/verifyToken");
const photoupload = require("../middleware/photoupload");

// /api/users
router.get("/", verifyTokenAndAdmin, getAllUsers);

// /api/users/:id
router
  .route("/:id")
  .put(verifyTokenAndAuthorization, UpdateUserCtrl)
  .get(verifyTokenAndAdmin, getUserById)
  .delete(verifyTokenAndAuthorization, deleteUser);
  
router
  .route("/profile/profile-photo-upload")
  .post(verifyToken, photoupload.single("image"), profilePhotoUploadCtrl);

module.exports = router;
