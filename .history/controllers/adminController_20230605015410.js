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
  
      // Check if the admin exists
      const user = await User.findOne({ metamaskid });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }
      // Compare the provided password with the stored password
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
      }
  
      // Generate a JWT token with isAdmin property
      const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, config.secret_jwt);
      res.status(200).json({ success: true, token, isAdmin: user.isAdmin ,message:"Logged in Successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to login.', error: error.message });
    }
  };
// Admin profile
  const adminProfile = async (req, res) => {
    try {
      const userId =  req.userData._id; // Retrieve user ID from the decoded token
      console.log(req.userData._id);
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
// Update Admin password 
const update_password = async(req, res)=>{
  try {
      const user_id =   req.userData._id ;
      const password = req.body.password;

      const data = await User.findOne({ _id:user_id });
      if(data)
      {
         const newPasword = await securePassword(password);

       const userdata = await  User.findByIdAndUpdate({_id:user_id},{$set:{
          password:newPasword
         }});
         res.status(200).send({success:true,message:"Admin Password has been updated!"});
      }
      else{
          res.status(200).send({success:false, message:"User id not found"});
      }
  } catch (error) {
      res.status(400).send(error.message);
  }
}

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
