const Application = require("../models/ApplicationModel");
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const User = require("../models/userModel");
const archiver = require('archiver');
const config = require("../config/config");

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = path.join(__dirname, '..', 'public', 'degreeImages');
    fs.mkdirSync(destinationPath, { recursive: true });
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const name = `${file.fieldname}-${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};


const upload = multer({ storage: storage, fileFilter: fileFilter });

const createApplication = async (req, res, next) => {
  upload.fields([
    { name: 'degreeImage', maxCount: 1 },
    { name: 'degreePdf', maxCount: 1 },
  ])(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error(err);
      return res.status(400).send('Bad request');
    } else if (err) {
      console.error('errrr', err);
      return res.status(500).send('Internal server error');
    }

    const {
      fullname,
      gender,
      cnic_no,
      degree_reg_no,
      university,
      passing_year,
    } = req.body;

    const user_id = req.user._id;

    let degreeImage = '';
    const baseUrl = `http://localhost:3000`;

    if (req.files && req.files.degreeImage && req.files.degreeImage.length > 0) {
      degreeImage = `${baseUrl}/degreeImages/${req.files.degreeImage[0].filename}`;
    }
    let degreePdf = '';

    if (req.files && req.files.degreePdf && req.files.degreePdf.length > 0) {
      degreePdf = `${baseUrl}/degreeImages/${req.files.degreePdf[0].filename}`;
    }
    const application = new Application({
      fullname,
      gender,
      cnic_no,
      degree_reg_no,
      university,
      passing_year,
      degreeImage,
      degreePdf, 
      user_id,
    });

    const savedApplication = await application.save();

    res.status(201).json({
      success: true,
      msg: 'Application submitted successfully',
    });
  });
};


// Handle GET request to retrieve all applications
const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({});
    res.status(200).json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

// Count All applications
const count_Applications = async(req,res)=>{
  try {
    const count = await Application.countDocuments();
    if(count){
      res.send({ count });
    }
    else{
      res.send({msg:"No Users Found"})
    }
  } catch (error) {
    console.log(error);
  }
}

// Application Status Update
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status, reason } = req.body;

    // Find the application by ID and update the status and reason
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status, reason },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

const downloadDegreedocs = async (req, res) => {
  try {
    const { degree_reg_no } = req.body;

    // Get the subdirectory paths based on degree_reg_no
    const degreeImagesPath = path.join(__dirname, `../public/degreeImages/${degree_reg_no}`);
    const degreePdfsPath = path.join(__dirname, `../public/degreePdfs/${degree_reg_no}`);

    let filesFound = false;
    const filesToDownload = [];

    // Check if the subdirectory exists in degreeImages
    if (fs.existsSync(degreeImagesPath)) {
      const degreeImagesFiles = fs.readdirSync(degreeImagesPath);
      if (degreeImagesFiles.length > 0) {
        degreeImagesFiles.forEach((file) => {
          const filePath = path.join(degreeImagesPath, file);
          filesToDownload.push(filePath);
        });
        filesFound = true;
      }
    }

    // Check if the subdirectory exists in degreePdfs
    if (fs.existsSync(degreePdfsPath)) {
      const degreePdfsFiles = fs.readdirSync(degreePdfsPath);
      if (degreePdfsFiles.length > 0) {
        degreePdfsFiles.forEach((file) => {
          const filePath = path.join(degreePdfsPath, file);
          filesToDownload.push(filePath);
        });
        filesFound = true;
      }
    }

    if (!filesFound) {
      return res.status(404).json({ success: false, msg: 'Files not found' });
    }

    // Create a ZIP archive and add the files to it
    const archive = archiver('zip', { zlib: { level: 9 } });
    filesToDownload.forEach((filePath) => {
      archive.file(filePath, { name: path.basename(filePath) });
    });

    // Set the appropriate headers for the ZIP file
    res.attachment('files.zip');
    archive.pipe(res);

    // Finalize the archive and send it as the response
    archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

module.exports = {
  createApplication,
  getAllApplications,
  count_Applications,
  updateApplicationStatus,
  downloadDegreedocs
};