const User = require("../models/userModel");
const OTP = require("../models/OTPmodel");
const bcrypt = require("bcryptjs");
const config = require("../config/config");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { generate } = require("randomstring");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

// Secure Password generate method
const securePassword = async(password)=>{
    try {
        
       const passwordHash = await bcrypt.hash(password,10);
       return passwordHash;
    } catch (error) {
        res.status(400).send(error.message); 
    }
}

// Register Method
const register_user = async(req, res)=>{
    try {
        if(req.body.password===req.body.confirmpassword){
            const spassword = await securePassword(req.body.password);
        const userData = await User.findOne({email:req.body.email});
        if(userData)
        {
            res.status(200).send({success:false,msg:"This email already exists!"});
        }
        else{
          const user = new User({
            metamaskid: req.body.metamaskid,
            name: req.body.name,
            email: req.body.email,
            password: spassword,
            image: req.file.filename
    });
            const user_data = await user.save();
            res.status(200).send({success:true,data:user_data});
        }

        }
        else{
            res.status(400).send({success:false,msg:"Password Doesnot match"});
        }
     
    } catch (error) {
        res.status(400).send(error.message);
    }
}

//login Method
const user_login = async (req, res) => {
    try {
      const { metamaskid, password } = req.body;
  
      const user = await User.findOne({ metamaskid });
  
      if (!user) {
        return res.status(404).json({ success: false, msg: "User not Found" });
      }
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
  
      if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, msg: "Wrong Password" });
      }
  
      const token = jwt.sign({ _id: user._id, isAdmin: user.isAdmin }, config.secret_jwt);
  
      const { password: userPassword, isAdmin, ...otherDetails } = user._doc;
  
      res.status(200).json({ success: true, msg: "User Logged in successfully",token});
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  };
  
// User Profile 
const userProfile = async (req, res) => {
    try {
      const userId =  req.user_id; // Retrieve user ID from the decoded token
  
      // Find user information based on the user ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
  
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to retrieve user profile.", error: error.message });
    }
  };

// Profile Image Change
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/userImages'));
    },
    filename: function (req, file, cb) {
      const name = Date.now() + '-' + file.originalname;
      cb(null, name);
    },
  });
  
  
  const fileFilter = function (req, file, cb) {
    if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"), false);
      }
  };
  
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Update Profile Picture
const updateProfileImage = async (req, res) => {
    try {
      const userId =   req.user_id;
      
      upload.single("image")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          console.error(err);
          return res.status(400).json({ success: false, message: "Bad request" });
        } else if (err) {
          console.error(err);
          return res.status(500).json({ success: false, message: "Internal server error" });
        }
        
        // Check if a file is uploaded
        if (!req.file) {
          return res.status(400).json({ success: false, message: "Image file not found" });
        }
        
        const image = req.file.filename;
  
        // Update the profile image in the user model
        const updatedUser = await User.findByIdAndUpdate(userId, { image: image }, { new: true });
  
        if (!updatedUser) {
          return res.status(404).json({ success: false, message: "User not found." });
        }
  
        res.status(200).json({ success: true, message: "Profile image updated successfully.", user: updatedUser });
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update profile image.", error: error.message });
    }
  };
  
// Update password method
const update_password = async(req, res)=>{
    try {
        const user_id =   req.user_id ;
        const password = req.body.password;

        const data = await User.findOne({ _id:user_id });
        if(data)
        {
           const newPasword = await securePassword(password);

         const userdata = await  User.findByIdAndUpdate({_id:user_id},{$set:{
            password:newPasword
           }});
           res.status(200).send({success:true,message:"Password has been updated!"});
        }
        else{
            res.status(200).send({success:false, message:"User id not found"});
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

// Forget Password Method
const forget_password = async(req,res)=>{
    try {
        const email= req.body.email;
        const userData = await User.findOne({email:req.body.email});
        if(userData)
        {
        const randomString =  randomstring.generate();
        const data = await  User.updateOne({email:email},{$set:{token:randomString}});
        sendresetPasswordMail(userData.name,userData.email,randomString);
        res.status(200).send({success:true, message:"Please check your email inbox to reset your password"});
        }
        else{
            res.status(200).send({success:true, message:"This email does not exists!"});
        }
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});  
    }
}

// Send reset password mail 
const sendresetPasswordMail = async(name,email,token)=>{
    try {
     const transporter =  nodemailer.createTransport({
           host:'smtp.gmail.com',
           port:587,
           secure:false,
           requireTLS:true,
           auth:{
               user:config.emailAdmin,
               pass:config.emailPassword,
           }
       });

       const mailOptions = {
           from: config.emailAdmin,
           to : email,
           subject: 'For Password Reset',
           html:'<p> Hi'+name+'please click on the link <a href="http://127.0.0.1:3000/api/reset-password?token='+token+'">to reset your password </a>'
        }
        transporter.sendMail(mailOptions,function(error,info){
          if(error)
          {
            console.log(error);
          }
          else{
           console.log('Mail has been sent',info.response);
          }
        });
    } catch (error) {
       res.status(400).send({success:true,message:error.message});
    }
}

// Reset password Method
const reset_password = async(req,res)=>{
    try {
        const newPassword  = req.body;
        const token = req.params.token; ;
        const userdata = await User.findOne({ token });
        if (!userdata) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
          }
        else{
            const Password = await securePassword(newPassword);
            userdata.password = Password;
            userdata.token = " ";
            await userdata.save();
            
            return res.status(200).json({ success: true, message: 'Password updated successfully' });
        }  
    } catch (error) {
        res.status(400).send({success:false,msg:error.message});  
    }
}

// Sending OTP to email
const send_otp = async(req,res)=>{
    const {email} = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const otp_code = await OTP.findOneAndUpdate({ email }, { otp }, { upsert: true });
        const transporter =  nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailAdmin,
                pass:config.emailPassword,
            }
        });
        const mailOptions = {
            from: config.emailAdmin,
            to : email,
            subject: 'Your OTP for Email verification',
            text:`Your OTP for email verification is ${otp}.`
         }
         await transporter.sendMail(mailOptions);
         res.send('OTP sent'); 
    } catch (error) {
        console.log(error);
        res.status(500).send("Error Sending OTP");
    }
}

// verify OTP
const verify_otp = async(req,res)=>{
    const {email, otp } = req.body;
   try {
    const user_otp = await OTP.findOne({ email, otp});
    if(user_otp)
    {
        res.status(200).send("OTP Verified");
    }
    else
    {
        res.status(400).send("OTP verification failed");
    }
   } catch (error) {
    console.log(error);
    res.status(500).send("Error Verifying OTP");
   }
}

// User Count 
const count_Users = async(req,res)=>{
   try {
    const count = await User.countDocuments();
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

module.exports ={
    register_user,
    user_login,
    userProfile,
    updateProfileImage,
    update_password,
    forget_password,
    reset_password,
    send_otp,
    verify_otp,
    count_Users
   
}