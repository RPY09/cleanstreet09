const Issue = require("../models/Issue");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { extractPostalCode } = require("../utils/extractPostalCode");
const User = require("../models/user");

const uploadBufferToCloudinary = (
  fileBuffer,
  options = {},
  timeoutMs = 30000
) => {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error("Cloudinary upload timeout"));
      }
    }, timeoutMs);

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        clearTimeout(timer);
        if (finished) return;
        finished = true;
        if (error) return reject(error);
        return resolve(result.secure_url || result.url);
      }
    );

    // handle stream errors
    streamifier
      .createReadStream(fileBuffer)
      .on("error", (streamErr) => {
        clearTimeout(timer);
        if (finished) return;
        finished = true;
        reject(streamErr);
      })
      .pipe(uploadStream);
  });
};

// @route POST /api/issues
// @access Private
exports.reportIssue = async (req, res) => {
  console.log("REPORT ISSUE: incoming request. user:", req.user?._id);
  const { title, issueType, priority, address, landmark, description } =
    req.body;
  const imageFiles = req.files; // array of files from multer

  // console.log(
  //   `REPORT ISSUE: fields - title=${title}, issueType=${issueType}, images=${
  //     imageFiles?.length || 0
  //   }`
  // );

  if (!title || !issueType || !address || !description) {
    console.log("REPORT ISSUE: validation failed");
    return res.status(400).json({
      success: false,
      message: "Please include all required issue fields.",
    });
  }

  try {
    const uploadedImages = [];

    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        // console.log(
        //   `REPORT ISSUE: uploading image ${i + 1}/${imageFiles.length} name=${
        //     file.originalname
        //   } size=${file.size}`
        // );
        try {
          const url = await uploadBufferToCloudinary(
            file.buffer,
            { folder: "cleanstreet_issues" },
            30000
          );
          // console.log(`REPORT ISSUE: uploaded image ${i + 1} -> ${url}`);
          uploadedImages.push(url);
        } catch (uploadErr) {
          console.error(
            `REPORT ISSUE: image upload failed for ${file.originalname}:`,
            uploadErr.message || uploadErr
          );
          return res.status(500).json({
            success: false,
            message: "Image upload failed",
            details: uploadErr.message || String(uploadErr),
          });
        }
      }
    }

    console.log("REPORT ISSUE: creating DB record...");
    const postalCode = extractPostalCode(address);
    const newIssue = await Issue.create({
      title,
      issueType,
      priority,
      address,
      postalCode,
      landmark,
      description,
      imageUrls: uploadedImages,
      reportedBy: req.user._id,
    });

    console.log("REPORT ISSUE: issue saved:", newIssue._id);
    res.status(201).json({
      success: true,
      message: "Issue reported successfully!",
      issue: newIssue,
    });
  } catch (error) {
    console.error("REPORT ISSUE: unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during issue submission.",
      details: error.message,
    });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const issues = await Issue.find();

    if (user?.postalCode) {
      issues.sort((a, b) => {
        const aMatch = a.postalCode === user.postalCode;
        const bMatch = b.postalCode === user.postalCode;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    res.status(200).json({ success: true, issues });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
