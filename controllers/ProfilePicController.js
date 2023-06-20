const User = require("../models/userModel");
const sharp = require("sharp"); // Required for image resizing
const path = require("path");
const fs = require("fs");
const baseURL = "http://localhost:3000";

const uploadProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profilePic = req.file;

    // Find the user to get their name
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Resize the image
    const resizedImage = await sharp(profilePic.path)
      .resize(200) // Adjust the desired size as per your requirement
      .toBuffer();

    // Delete the original file
    fs.unlinkSync(profilePic.path);

    // Save the resized image with the user's name as the file name
    const resizedFilename = `${user.name}${path.extname(
      profilePic.originalname
    )}`;
    const imagePath = path.join(
      __dirname,
      "..",
      "public",
      "profile-pictures",
      resizedFilename
    );
    await sharp(resizedImage).toFile(imagePath);

    // Construct the image URL with the base URL and username
    const imageURL = `${baseURL}/profile-pictures/${resizedFilename}`;

    // Update the user record with the image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: imageURL },
      { new: true }
    );

    res.json({
      message: "Profile picture uploaded successfully",
      imageURL: updatedUser.image,
      name: updatedUser.name,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadProfilePicture,
};
