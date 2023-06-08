const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
  adminResponse: {
    type: String,
    default: null,
  },
}, { timestamps: true });

const ContactUs = mongoose.model("ContactUs", contactUsSchema);

module.exports = ContactUs;
