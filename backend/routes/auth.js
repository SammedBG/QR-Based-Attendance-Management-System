const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Student = require("../models/Student")
const Teacher = require("../models/Teacher")
const bcrypt = require("bcrypt")
const { protect, authorize } = require("../middleware/auth")

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, userType, usn, regNo, department, semester, employeeId } = req.body

    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      userType,
    })

    // Create student or teacher profile
    if (userType === "STUDENT") {
      if (!usn || !regNo || !department || !semester) {
        await User.findByIdAndDelete(user._id)
        return res.status(400).json({ error: "Missing required student fields" })
      }

      await Student.create({
        user: user._id,
        usn,
        regNo,
        department,
        semester,
      })
    } else if (userType === "TEACHER") {
      if (!employeeId || !department) {
        await User.findByIdAndDelete(user._id)
        return res.status(400).json({ error: "Missing required teacher fields" })
      }

      await Teacher.create({
        user: user._id,
        employeeId,
        department,
      })
    }

    // Return user with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Return user with token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    let profile = null
    if (user.userType === "STUDENT") {
      profile = await Student.findOne({ user: user._id })
    } else if (user.userType === "TEACHER") {
      profile = await Teacher.findOne({ user: user._id })
    }

    res.json({ user, profile })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST /api/auth/register-device
// @desc    Register a student's device
// @access  Private (Students only)
router.post("/register-device", protect, authorize("STUDENT"), async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body

    if (!deviceId || !deviceName) {
      return res.status(400).json({ error: "Device ID and name are required" })
    }

    const student = await Student.findOne({ user: req.user._id })
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" })
    }

    // Check if device is already registered
    const existingDevice = student.registeredDevices.find((device) => device.deviceId === deviceId)

    if (existingDevice) {
      // Update last used timestamp
      existingDevice.lastUsed = new Date()
      existingDevice.deviceName = deviceName // Update name in case it changed
    } else {
      // Add new device
      student.registeredDevices.push({
        deviceId,
        deviceName,
        lastUsed: new Date(),
      })
    }

    await student.save()

    res.json({
      message: "Device registered successfully",
      devices: student.registeredDevices,
    })
  } catch (error) {
    console.error("Register device error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST /api/auth/set-pin
// @desc    Set student's PIN for attendance verification
// @access  Private (Students only)
router.post("/set-pin", protect, authorize("STUDENT"), async (req, res) => {
  try {
    const { pin } = req.body

    if (!pin || pin.length < 4) {
      return res.status(400).json({ error: "PIN must be at least 4 digits" })
    }

    const student = await Student.findOne({ user: req.user._id })
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" })
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10)
    const hashedPin = await bcrypt.hash(pin, salt)

    student.pin = hashedPin
    await student.save()

    res.json({ message: "PIN set successfully" })
  } catch (error) {
    console.error("Set PIN error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST /api/auth/update-security
// @desc    Update student's security preferences
// @access  Private (Students only)
router.post("/update-security", protect, authorize("STUDENT"), async (req, res) => {
  try {
    const { securityPreferences } = req.body

    const student = await Student.findOne({ user: req.user._id })
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" })
    }

    student.securityPreferences = {
      ...student.securityPreferences,
      ...securityPreferences,
    }

    await student.save()

    res.json({
      message: "Security preferences updated successfully",
      securityPreferences: student.securityPreferences,
    })
  } catch (error) {
    console.error("Update security preferences error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
