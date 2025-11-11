const express = require("express");
const {
  reportIssue,
  getAllIssues,
  // Removed addComment (comments handled in commentRoutes)
  toggleVote,
} = require("../controllers/issueController");

const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

router.post("/", protect, upload.array("images", 3), reportIssue);
router.get("/", protect, getAllIssues);

// Make vote route explicit to avoid collisions with comments route
router.post("/:id/vote/:type", protect, toggleVote);

module.exports = router;
