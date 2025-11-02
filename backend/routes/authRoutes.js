const express = require("express");
const {
  registerUser,
  loginUser,
  getDashboardData,
  updateUserProfile,
  sendOtp,
  verifyOtp,
  changePassword,
  verifyOtpOnly,
  resetPasswordWithOtp,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// New endpoints for OTP-only verification and reset-with-OTP
router.post("/verify-otp-only", verifyOtpOnly);
router.post("/reset-password", resetPasswordWithOtp);

router.get("/dashboard", protect, getDashboardData);

// Protected profile update and change-password
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
