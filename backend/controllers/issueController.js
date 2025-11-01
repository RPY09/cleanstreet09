const Issue = require("../models/Issue");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier"); // Used to stream memory-stored file to Cloudinary

// @route POST /api/issues
// @access Private
exports.reportIssue = async (req, res) => {
  const { title, issueType, priority, address, landmark, description } =
    req.body;
  const imageFiles = req.files; // Array from multer

  if (!title || !issueType || !address || !description) {
    return res.status(400).json({
      success: false,
      message: "Please include all required issue fields.",
    });
  }

  try {
    let uploadedImages = [];

    // MULTI-IMAGE UPLOAD TO CLOUDINARY
    if (imageFiles && imageFiles.length > 0) {
      // Helper function for buffer upload
      const uploadFromBuffer = (file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "cleanstreet_issues" },
            (error, result) => {
              if (result) {
                resolve(result.secure_url);
              } else {
                reject(error);
              }
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      };

      // Upload all images in parallel (up to 3)
      uploadedImages = await Promise.all(
        imageFiles.map((file) => uploadFromBuffer(file))
      );
    }

    // Create Issue in Database
    const newIssue = await Issue.create({
      title,
      issueType,
      priority,
      address,
      landmark,
      description,
      imageUrls: uploadedImages,
      reportedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Issue reported successfully!",
      issue: newIssue,
    });
  } catch (error) {
    console.error("Issue reporting error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during issue submission.",
    });
  }
};
