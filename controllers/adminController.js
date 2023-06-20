const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const config = require("../config/config");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { generate } = require("randomstring");

//login Method
const login_admin = async (req, res) => {
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
// Admin profile
const adminProfile = async (req, res) => {
  try{
   const userId = req.user._id; // Retrieve user ID from the decoded token
   console.log("user id",userId);
   // Find user information based on the user ID
   const user = await User.findById(userId);
 
   if (!user) {
     return res.status(404).json({ success: false, message: "User not found." });
   }
 
   // Exclude sensitive information like password
   const { password, ...userData } = user._doc;
 
   return res.status(200).json({ success: true, user: userData });
 } catch (error) {
   return res.status(500).json({ success: false, message: "Failed to retrieve user profile.", error: error.message });
 }
 };
// Update Admin password 
// Update Admin password 
// Secure Password generate method
const securePassword = async(password)=>{
  try {
      
     const passwordHash = await bcrypt.hash(password,10);
     return passwordHash;
  } catch (error) {
      res.status(400).send(error.message); 
  }
}
const update_password = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { password, confirm_password } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: "Password and confirm password do not match" });
    }

    const data = await User.findOne({ _id: user_id });
    if (data) {
      const newPasword = await securePassword(password);

      const userdata = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: newPasword } });
      res.status(200).send({ success: true, message: "Admin Password has been updated!" });
    } else {
      res.status(200).send({ success: false, message: "User id not found" });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// Admin Forget Password Method
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

// Admin Reset password Method
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

module.exports = {
  login_admin,
  adminProfile,
  update_password,
  forget_password,
  reset_password
};
