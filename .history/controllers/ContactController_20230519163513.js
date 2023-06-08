const ContactUs = require("../models/ContactModel");

const createQuery = async (req, res) => {
    try {
      const { query } = req.body;
      const user_id =  req.userData._id; // Use the user_id from the decoded token
  
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
      const queries = await ContactUs.find({}, "_id query");
  
      res.status(200).json({ success: true, queries });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to retrieve queries.", error: error.message });
    }
  };
  
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
  
  
  const getQueriesByUserId = async (req, res) => {
    try {
      const user_id =  req.userData._id; // Retrieve user_id from the decoded token
  
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
  
  

  module.exports = {
    createQuery,
    getAllQueries,
    updateQueryResponse,
    getQueriesByUserId
  };
