const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP");
const nodemailer = require("nodemailer");

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// --- NODEMAILER TRANSPORTER SETUP ---
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// --- Registration  ---
exports.registerUser = async (req, res) => {
  const { name, username, email, phone, password, location } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({
      name,
      username,
      email,
      phone,
      location,
      password: hashedPassword,
      role: email.includes("@admin.com") ? "admin" : "user",
    });
    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        location: user.location,
        role: user.role,
        memberSince: user.memberSince,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

// --- Login  ---
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        location: user.location,
        role: user.role,
        memberSince: user.memberSince,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // 1. Verify Current Password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    // 2. Hash and Update New Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password change.",
    });
  }
};

// --- Dashboard Data ---
exports.getDashboardData = async (req, res) => {
  const userId = req.user._id;

  // MOCK DATA for initial setup:
  const stats = {
    totalIssues: 15,
    pending: 3,
    inProgress: 5,
    resolved: 7,
  };
  const activities = [
    {
      issue: "Pothole on Road HYD. (Your Report)",
      status: "resolved",
      time: "1 hour ago",
    },
    {
      issue: "Damage at Central Park",
      status: "in progress",
      time: "3 days ago",
    },
  ];

  res.status(200).json({ success: true, stats, activities });
};

// --- Profile Update ---
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.username = req.body.username || user.username;
      // Email must not be editable via this endpoint for safety
      // user.email = req.body.email || user.email; // intentionally not allowed
      user.phone = req.body.phone || user.phone;
      user.location = req.body.location || user.location;
      user.bio = req.body.bio || user.bio;

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully!",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          bio: updatedUser.bio,
          role: updatedUser.role,
          memberSince: updatedUser.memberSince,
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating profile" });
  }
};

// --- Send OTP (Forgot Password) ---
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, an OTP has been sent.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "CleanStreet Password Reset OTP",
      html: `
        <p>You requested a password reset for your CleanStreet account.</p>
        <h2 style="color: #28a745;">Your OTP is: <b>${otp}</b></h2>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      `,
    });

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP." });
  }
};

// --- Verify OTP (existing flow used for login/OTP-login) ---
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    // Remove the OTP after successful use (one-time)
    await OTP.deleteOne({ email });

    const user = await User.findOne({ email });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "OTP verified. Login successful.",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        memberSince: user.memberSince,
      },
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during verification." });
  }
};

/**
 * New endpoint: verifyOtpOnly
 * Verifies OTP but DOES NOT delete it. Used to "unlock" UI for password reset.
 */
exports.verifyOtpOnly = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP required." });
  }

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    res.json({ success: true, message: "OTP verified." });
  } catch (error) {
    console.error("verifyOtpOnly error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error verifying OTP." });
  }
};

/**
 * New endpoint: resetPasswordWithOtp
 * Resets a user's password using email + OTP + newPassword.
 * Deletes OTP once used.
 */
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP and new password are required.",
    });
  }

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User not found for supplied email.",
        });
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // remove OTP record once used
    await OTP.deleteOne({ email });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("resetPasswordWithOtp error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password.",
    });
  }
};
