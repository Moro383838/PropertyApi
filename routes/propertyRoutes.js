const router = require("express").Router();
const {
  CreatePropertyCtrl,
  GetAllPropertiesCtrl,
  GetPropertyByIdCtrl,
  UpdatePropertyCtrl,
  DeletePropertyCtrl,
  updatePropertyImageCtrl,
  ChipCtrl,
  GetAvgPricePerCityCtrl,
  toggleLikes,
  getMostExpensiveProperties,
  getAvailableProperties,
  getMyPropertyBookings,
} = require("../controllers/propertyController");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
} = require("../middleware/verifyToken");
const photoUpload = require("../middleware/photoupload");

router.get("/available", verifyToken, getAvailableProperties);
router.route("/mypro").get(verifyToken, getMyPropertyBookings);

router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), CreatePropertyCtrl)
  .get(GetAllPropertiesCtrl);

router.route("/chipfive").get(verifyToken, ChipCtrl);
router.route("/percity").get(verifyToken, GetAvgPricePerCityCtrl);
router.route("/expensive").get(verifyToken, getMostExpensiveProperties);

router
  .route("/update-image/:id")
  .put(verifyToken, photoUpload.single("image"), updatePropertyImageCtrl);

router
  .route("/:id")
  .get(GetPropertyByIdCtrl)
  .put(verifyToken, UpdatePropertyCtrl)
  .delete(verifyToken, DeletePropertyCtrl);

router.route("/like/:id").put(verifyToken, toggleLikes);

module.exports = router;
