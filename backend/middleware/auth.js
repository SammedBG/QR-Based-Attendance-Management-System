const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware to verify JWT token
exports.protect = async (req, res, next) => {
  let token

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ error: "Not authorized to access this route" })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from token
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: "Not authorized to access this route" })
  }
}

// Middleware to restrict access to specific user types
exports.authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({ error: `User type ${req.user.userType} is not authorized to access this route` })
    }
    next()
  }
}
