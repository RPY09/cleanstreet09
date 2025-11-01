const express = require("express");
const { reportIssue } = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

// Configure Multer to temporarily store the files in memory before uploading to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// MULTI-IMAGE: Accept up to 3 files, field name "images"
const router = express.Router();
router.post("/", protect, upload.array("images", 3), reportIssue);

module.exports = router;
