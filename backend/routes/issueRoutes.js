const express = require("express");
const { reportIssue } = require("../controllers/issueController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

router.post("/", protect, upload.array("images", 3), reportIssue);

module.exports = router;
