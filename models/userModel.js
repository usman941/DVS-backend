const mongoose = require("mongoose");

const user = mongoose.Schema({
    metamaskid:{
        type: String,
        required : true,
        unique: true
      },
      name:{
        type: String,
        required: true
      },
      password:{
        type: String,
        required : true
      },
      image:{
           type:String,
           required:true
      },
      email:{
        type: String,
        required : true,
        unique : true
      },
      date:{
        type: Date,
        default: Date.now()
      },
      isAdmin:{
        type : Boolean,
        default: false
    },
      token:{
        type:String,
        default:''
      }
}, { timestamps: true });

module.exports =  mongoose.model("User",user);