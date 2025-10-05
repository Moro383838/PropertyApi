const router = require("express").Router();
const { RegisterCtrl, LoginCtrl } = require("../controllers/authController");
router.post("/register", RegisterCtrl);
router.post("/login", LoginCtrl);

module.exports = router;
