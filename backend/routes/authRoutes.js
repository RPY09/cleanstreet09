const express = require("express");
const {
  registerUser,
  loginUser,
  getDashboardData,
  updateUserProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/dashboard", protect, getDashboardData);

// NEW PROTECTED ROUTE for updating profile
router.put("/profile", protect, updateUserProfile);

module.exports = router;
