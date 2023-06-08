const jwt = require("jsonwebtoken");
const config = require("../config/config");

const verifyToken = async (req, res, next) => {
  // const token = req.body.token || req.query.token || req.headers["authorization"];
  const token = req.headers.authorization.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, msg: "Token is required for authentication." });
  }

  try {
    const decoded = jwt.verify(token, config.secret_jwt);
    req.user= decoded; // Extract and store the user ID from the token payload
    next();
  } catch (error) {
    return res.status(401).json({ success: false, msg: "Invalid token." });
  }
};
const verifyAdmin = async (req, res, next) => {
  //  const token = req.body.token || req.query.token || req.headers["authorization"];
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, msg: "Token is required for authentication." });
  }

  try {
    const decoded = jwt.verify(token, config.secret_jwt);
    req.user = decoded; // Store the decoded token payload in req.user

    if (req.user.isAdmin) {
      next(); // Allow access if the user is an admin
    } else {
      return res.status(403).json({ success: false, msg: "Access denied. User is not an admin." });
    }
  } catch (error) {
    return res.status(401).json({ success: false, msg: "Invalid token." });
  }
};

module.exports = {verifyToken,verifyAdmin};
