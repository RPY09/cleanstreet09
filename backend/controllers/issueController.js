const Issue = require("../models/Issue");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier"); // Used to stream memory-stored file to Cloudinary

// @route POST /api/issues
// @access Private
exports.reportIssue = async (req, res) => {
  const { title, issueType, priority, address, landmark, description } =
    req.body;
  const imageFile = req.file; // File comes from multer middleware (stored in memory)

  if (!title || !issueType || !address || !description) {
    return res.status(400).json({
      success: false,
      message: "Please include all required issue fields.",
    });
  }

  try {
    let uploadedImage = null;

    // 1. Image Upload to Cloudinary (using stream)
    if (imageFile) {
      const uploadFromBuffer = (file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "cleanstreet_issues" }, // Folder name in Cloudinary
            (error, result) => {
              if (result) {
                resolve(result.secure_url);
              } else {
                reject(error);
              }
            }
          );
          // Pipe the buffer into the upload stream
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      };

      uploadedImage = await uploadFromBuffer(imageFile);
    }

    // 2. Create Issue in Database
    const newIssue = await Issue.create({
      title,
      issueType,
      priority,
      address,
      landmark,
      description,
      imageUrl: uploadedImage,
      reportedBy: req.user._id, // User ID comes from the 'protect' middleware
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
