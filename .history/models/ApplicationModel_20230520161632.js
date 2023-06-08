const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullname: { type: String, required: true },
  gender: { type: String, required: true },
  cnic_no: { type: String, required: true },
  degree_reg_no: { type: String, required: true },
  university: { type: String, required: true },
  passing_year: { type: String, required: true },
  degreeImage: { type: String, required: true },
  degreePdf: { type: String, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
