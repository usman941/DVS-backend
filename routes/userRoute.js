const express = require("express");
const router = express();

const bodyParser = require("body-parser");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));

const multer = require("multer");
const path = require("path");
const fs = require("fs");

router.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function (req, file, cb) {
      const name = Date.now() + '-' + file.originalname;
      cb(null, name);
    },
  });

const upload = multer({ storage:storage});

const user_controller = require("../controllers/userControllers");
const admin_controller = require("../controllers/adminController");
const app_controller = require("../controllers/AppilcationController");
const contactUs_controller = require("../controllers/ContactController");
const {verifyToken,verifyAdmin} = require("../middlewares/auth");







//Register Route
router.post('/register',upload.single('image'),user_controller.register_user);
//Login Route
router.post('/login',user_controller.user_login);
//Profile Route
router.get('/profile',verifyToken,user_controller.userProfile);
// Update Profile Image
router.put('/changeprofile',verifyToken,user_controller.updateProfileImage);
//Update Password Route
router.post('/update-password',verifyToken,user_controller.update_password);
// Forget Password Route 
router.post('/forget-password',user_controller.forget_password);
//Reset Password Route
router.put('/reset-password/:token',user_controller.reset_password);
// Send OTP route
router.post('/send-otp',user_controller.send_otp);
// Verify OTP route
router.post('/verify-otp',user_controller.verify_otp);
// Create Application route
router.post('/create-application',verifyToken,app_controller.createApplication);
// Send contact Query route
router.post('/send-query',verifyToken,contactUs_controller.createQuery);























////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Admin routes . need to change these
//Login Route
router.post('/loginAdmin',admin_controller.login_admin);
// Admin Profile
router.get('/profile',verifyAdmin,admin_controller.adminProfile);
//Admin Update Password Route
router.put('/AdminUpdate-password',verifyAdmin,admin_controller.update_password);
// Admin Forget Password Route 
router.post('/AdminForget-password',admin_controller.forget_password);
//Admin Reset Password Route
router.put('/AdminReset-password/:token',admin_controller.reset_password);
// Count Users route
router.get('/count_user',verifyAdmin,user_controller.count_Users);
// get all Application route
router.get('/display_applications',app_controller.getAllApplications);
// Count Application route
router.get('/count_app',verifyAdmin,app_controller.count_Applications);
// get all queries route
router.get('/display_queries',verifyAdmin,contactUs_controller.getAllQueries);
// update query response
router.put('/adminResponse',verifyAdmin,contactUs_controller.updateQueryResponse);
// update query response by email
router.put('/adminResponsebymail',verifyAdmin,contactUs_controller.updateQueryResponsebymail);
// get queries of a single user_id route
router.get('/search_queries',verifyAdmin,verifyToken,contactUs_controller.getQueriesByUserId);
// update application status
router.put('/application_status_update',verifyAdmin,app_controller.updateApplicationStatus);
// download degree docs
router.get('/download_docs/:degree_reg_no', app_controller.downloadDegreedocs);
// query delete
router.delete('/deleteQueries/:id', contactUs_controller.deleteQuery);
// Show all accepted applications
router.get('/showallAccepted',app_controller.getAcceptedApplications);
// count applications by status
router.get('/countAPPbyStatus',app_controller.countApplicationsByStatus);
// count quries
router.get('/countQueries',contactUs_controller.countQueriesByAdminResponse);
router.get('/countAllQueries',contactUs_controller.countAllQueries);

const { uploadProfilePicture } = require("../controllers/ProfilePicController");
// Set up Multer storage for profile picture
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imagePath = path.join(__dirname, "..", "public", "profile-pictures");
    fs.mkdirSync(imagePath, { recursive: true }); // Create the directory if it doesn't exist
    cb(null, imagePath);
  },
  filename: (req, file, cb) => {
    const userId = req.userId;
    const filename = `${userId}-${file.originalname}`;
    cb(null, filename);
  },
});

// Create Multer instance for profile picture
const uploadProfilePictureMiddleware = multer({
  storage: profilePictureStorage,
  fileFilter: (req, file, cb) => {
    cb(null, true); // Accept all files
  },
}).single("profilePic");
// Routes
router.put(
  "/upload-profile-picture",verifyToken, uploadProfilePictureMiddleware, uploadProfilePicture
);
module.exports = router;