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
    const degreeRegNo = req.body.degree_reg_no; // Assuming degree_reg_no is provided in the request body
    const destinationPath = path.join(__dirname, '..', 'public', 'degreeImages', degreeRegNo);
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
      const subfolderName = req.body.degree_reg_no; // Assuming degree_reg_no is provided in the request body
      degreeImage = `${baseUrl}/degreeImages/${subfolderName}/${req.files.degreeImage[0].filename}`;
    }
    let degreePdf = '';

    if (req.files && req.files.degreePdf && req.files.degreePdf.length > 0) {
      const subfolderName = req.body.degree_reg_no; 
      degreePdf = `${baseUrl}/degreeImages/${subfolderName}/${req.files.degreePdf[0].filename}`;
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
}


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
      res.status(200).json({ count : count });
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
      { status },
      { new: true }
    );

    // Check if the application exists
    if (!application) {
      return res.status(404).json({ success: false, msg: 'Application not found' });
    }

    // Send email to the user
    const user = await User.findById(application.user_id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      host:'smtp.gmail.com',
      port:587,
      secure:false,
      requireTLS:true,
      auth:{
          user:config.emailAdmin,
          pass:config.emailPassword,
      }
    });

    // Compose the email message
    let text = `Dear ${user.name},\n\nYour application has been  ${application.status}.`;

    if (application.status === 'Rejected') {
      text += `\n Reason: ${reason}`;
    }
    
    text += `\n\nBest regards,\nAdmin`;
    
    const mailOptions = {
      from: config.emailAdmin,
      to: user.email,
      subject: 'Application Status Update',
      text: text,
    };
    

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.json({ success: true, msg: 'Application status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

const downloadDegreedocs = async (req, res) => {
  try {
    const { degree_reg_no } = req.params;

    // Get the subdirectory path based on degree_reg_no
    const degreeFolderPath = path.join(__dirname, '..', 'public', 'degreeImages', degree_reg_no);

    if (!fs.existsSync(degreeFolderPath)) {
      return res.status(404).json({ success: false, msg: 'Files not found' });
    }

    // Create a ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Pipe the ZIP archive to the response
    res.attachment('files.zip');
    archive.pipe(res);

    // Add all files in the degree folder to the archive
    archive.directory(degreeFolderPath, false);

    // Finalize the archive and send it as the response
    archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};
// Handle GET request to retrieve all applications with status "Accepted"
const getAcceptedApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: "Accepted" });
    res.status(200).json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};
// Handle GET request to count applications based on status
const countApplicationsByStatus = async (req, res) => {
  try {
    const acceptedCount = await Application.countDocuments({ status: "Accepted" });
    const rejectedCount = await Application.countDocuments({ status: "Rejected" });
    const pendingCount = await Application.countDocuments({ status: "Pending" });
    
    const count = {
      accepted: acceptedCount,
      rejected: rejectedCount,
      pending : pendingCount
    };
    
    res.status(200).json(count);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};
// const countQueriesByAdminResponse = async (req, res) => {
//   try {
//     const nullResponseCount = await ContactUs.countDocuments({ adminResponse: null });
//     const nonNullResponseCount = await ContactUs.countDocuments({ adminResponse: { $ne: null } });

//     res.status(200).json({ success: true, nullResponseCount, nonNullResponseCount });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Failed to count queries.', error: error.message });
//   }
// };

// const countAllQueries = async (req, res) => {
//   try {
//     const queryCount = await ContactUs.countDocuments();

//     res.status(200).json({ success: true, queryCount });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Failed to count queries.', error: error.message });
//   }
// };
module.exports = {
  countApplicationsByStatus,
  getAcceptedApplications,
  createApplication,
  getAllApplications,
  count_Applications,
  updateApplicationStatus,
  downloadDegreedocs,
  
};