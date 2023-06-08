const mongoose = require("mongoose");

const userotp = mongoose.Schema({
    email: String,
    otp: String,
    expireAt : {
      type : Date,
      default: Date.now,
      expires: 120
    }
});

module.exports =  mongoose.model("OTP",userotp);