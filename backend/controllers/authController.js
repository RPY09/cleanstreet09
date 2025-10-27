
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

// --- Dashboard Data ---
exports.getDashboardData = async (req, res) => {
  // ... (dashboard logic is correct) ...
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
  // ... (profile update logic is correct) ...
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
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
  // ... (sendOtp logic is correct) ...
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

// --- Verify OTP (FINAL CORRECTION APPLIED) ---
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    // 1. Success: Delete the OTP record
    await OTP.deleteOne({ email });

    // 2. Find the user
    const user = await User.findOne({ email });

    // 3. FIX: Generate Token (This resolves the ReferenceError)
    const token = generateToken(user._id);

    // 4. Return a successful login response
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
