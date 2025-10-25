// CleanStreet_Team3/backend/routes/authRoutes.js
const express = require("express");
const {
  registerUser,
  loginUser,
  getDashboardData, // <-- This now points to a valid function
  updateUserProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/dashboard", protect, getDashboardData);

// NEW PROTECTED ROUTE for updating profile
router.put("/profile", protect, updateUserProfile); // <-- NEW

module.exports = router;
