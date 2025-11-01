const express = require("express");
const { reportIssue } = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// Configure Multer to temporarily store the file in memory before uploading to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// POST /api/issues: Protected, requires image file named 'image'
router.post("/", protect, upload.single("image"), reportIssue);

module.exports = router;
