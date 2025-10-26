const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
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
      // this is for the role or login between the admin and users
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

exports.getDashboardData = async (req, res) => {
  // Uses req.user data set by the protect middleware
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

// --- Profile ---
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Update fields from the request body
      user.name = req.body.name || user.name;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.location = req.body.location || user.location;
      user.bio = req.body.bio || user.bio;

      // role and password should not be updated via this route

      const updatedUser = await user.save();

      // 4. Send back the updated user data (excluding password)
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
