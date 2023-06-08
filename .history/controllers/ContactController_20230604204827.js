const ContactUs = require("../models/ContactModel");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const config = require("../config/config");

// Query create
const createQuery = async (req, res) => {
    try {
      const { query } = req.body;
      const user_id =   req.user._id; // Use the user_id from the decoded token
  
      if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID is required." });
      }
  
      // Create a new contact query
      const newQuery = new ContactUs({
        user_id,
        query,
      });
  
      // Save the query to the database
      await newQuery.save();
  
      res.status(201).json({ success: true, message: "Query submitted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to submit query.", error: error.message });
    }
  };

  const getAllQueries = async (req, res) => {
    try {
      const queries = await ContactUs.find({}, "_id query user_id").populate('user_id', 'name');
  
      const queriesWithUserDetails = queries.map((query) => {
        const { _id, query: queryText, user_id } = query;
        const { name } = user_id;
        return { _id, query: queryText, user: { name } };
      });
  
      res.status(200).json({ success: true, queries: queriesWithUserDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to retrieve queries.", error: error.message });
    }
  };
  
// Query Response Update  
  const updateQueryResponse = async (req, res) => {
    try {
      const { queryId, adminResponse } = req.body;
  
      if (!queryId || !adminResponse) {
        return res.status(400).json({ success: false, message: "Query ID and admin response are required." });
      }
  
      // Update the query with the admin response
      const updatedQuery = await ContactUs.findByIdAndUpdate(queryId, { adminResponse }, { new: true });
  
      if (!updatedQuery) {
        return res.status(404).json({ success: false, message: "Query not found." });
      }
  
      res.status(200).json({ success: true, message: "Query response updated successfully.", query: updatedQuery });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update query response.", error: error.message });
    }
  };
  // updated query response via email
  const updateQueryResponsebymail = async (req, res) => {
    try {
      const { queryId, adminResponse } = req.body;
  
      if (!queryId || !adminResponse) {
        return res.status(400).json({ success: false, message: "Query ID and admin response are required." });
      }
      const query = await ContactUs.findById(queryId);
  
      if (!query) {
        return res.status(404).json({ success: false, message: "Query not found." });
      }
      query.adminResponse = adminResponse;
      const updatedQuery = await query.save();
      // console.log(query.user_id);
      const user = await User.findById(query.user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
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
      // Compose the email
      const mailOptions = {
        from: config.emailAdmin,
        to: user.email,
        subject: "Query Response Update",
        text: `Dear User,\n\nYou have received an update for your query:\n\n${adminResponse}\n\nBest regards,\nYour Support Team`,
      };
  
      // Send the email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
  
      res.status(200).json({ success: true, message: "Query response updated successfully.", query: updatedQuery });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update query response.", error: error.message });
    }
  };
  
  // find query by ID
  const getQueriesByUserId = async (req, res) => {
    try {
      const user_id =   req.user._id; // Retrieve user_id from the decoded token
  
      if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID is required." });
      }
  
      // Find all queries matching the user_id
      const queries = await ContactUs.find({ user_id });
  
      res.status(200).json({ success: true, queries });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to retrieve queries.", error: error.message });
    }
  };
  const deleteQuery = async (req, res) => {
    try {
      const queryId = req.params.id; // Assuming the query ID is provided as a URL parameter
  
      // Find the query by its ID and remove it
      const deletedQuery = await ContactUs.findByIdAndRemove(queryId);
  
      if (!deletedQuery) {
        return res.status(404).json({ success: false, message: "Query not found" });
      }
  
      res.status(200).json({ success: true, message: "Query deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete query", error: error.message });
    }
  };
  const countQueriesByAdminResponse = async (req, res) => {
    try {
      const nullResponseCount = await ContactUs.countDocuments({ adminResponse: null });
      const nonNullResponseCount = await ContactUs.countDocuments({ adminResponse: { $ne: null } });
  
      res.status(200).json({ success: true, nullResponseCount, nonNullResponseCount });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to count queries.', error: error.message });
    }
  };
  
  const countAllQueries = async (req, res) => {
    try {
      const queryCount = await ContactUs.countDocuments();
  
      res.status(200).json({ success: true, queryCount });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to count queries.', error: error.message });
    }
  };

  module.exports = {
    createQuery,
    getAllQueries,
    updateQueryResponse,
    getQueriesByUserId,
    updateQueryResponsebymail,
    deleteQuery,
    countQueriesByAdminResponse,
    countAllQueries
  };