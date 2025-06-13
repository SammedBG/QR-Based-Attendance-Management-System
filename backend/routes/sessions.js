const express = require("express")
const router = express.Router()
const crypto = require("crypto")
const Session = require("../models/Session")
const Course = require("../models/Course")
const Teacher = require("../models/Teacher")
const { protect, authorize } = require("../middleware/auth")

// Generate QR code
const generateQRCode = (courseId, courseCode) => {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(4).toString("hex")
  return `${courseCode}-${timestamp}-${random}`
}

// @route   POST /api/sessions
// @desc    Create a new session
// @access  Private (Teachers only)
router.post("/", protect, authorize("TEACHER"), async (req, res) => {
  try {
    const { courseId, date, startTime, endTime } = req.body

    // Check if course exists and belongs to the teacher
    const teacher = await Teacher.findOne({ user: req.user._id })
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" })
    }

    const course = await Course.findOne({
      _id: courseId,
      teacher: teacher._id,
    })

    if (!course) {
      return res.status(404).json({ error: "Course not found or you do not have permission" })
    }

    // Generate QR code
    const qrCode = generateQRCode(course._id, course.code)

    // Create session
    // Ensure we have valid dates
    let parsedStartTime
    let parsedEndTime = null

    try {
      parsedStartTime = new Date(startTime)
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({ error: "Invalid start time format" })
      }

      if (endTime) {
        parsedEndTime = new Date(endTime)
        if (isNaN(parsedEndTime.getTime())) {
          return res.status(400).json({ error: "Invalid end time format" })
        }
      }
    } catch (error) {
      console.error("Date parsing error:", error)
      return res.status(400).json({ error: "Invalid date format" })
    }

    const session = await Session.create({
      course: course._id,
      teacher: req.user._id,
      date: new Date(date),
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      qrCode,
      active: true,
    })

    // Populate course details
    await session.populate({
      path: "course",
      select: "name code section semester",
    })

    res.status(201).json(session)
  } catch (error) {
    console.error("Create session error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/sessions
// @desc    Get all sessions (filtered by user role)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { active, courseId } = req.query

    const query = {}

    if (active === "true") {
      query.active = true
    } else if (active === "false") {
      query.active = false
    }

    if (courseId) {
      query.course = courseId
    }

    if (req.user.userType === "TEACHER") {
      // Teachers can only see their own sessions
      query.teacher = req.user._id
    }

    const sessions = await Session.find(query)
      .populate({
        path: "course",
        select: "name code section semester",
      })
      .sort({ date: -1, startTime: -1 })

    res.json(sessions)
  } catch (error) {
    console.error("Get sessions error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/sessions/:id
// @desc    Get a session by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate({
      path: "course",
      select: "name code section semester",
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    // Check if user has access to this session
    if (req.user.userType === "TEACHER" && session.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to access this session" })
    }

    res.json(session)
  } catch (error) {
    console.error("Get session error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/sessions/verify/:qrCode
// @desc    Verify a QR code
// @access  Private
router.get("/verify/:qrCode", protect, async (req, res) => {
  try {
    const session = await Session.findOne({ qrCode: req.params.qrCode })
      .populate({
        path: "course",
        select: "name code section semester",
      })
      .populate({
        path: "teacher",
        select: "name email",
      })

    if (!session) {
      return res.status(404).json({ error: "Invalid QR code or session not found" })
    }

    if (!session.active) {
      return res.status(400).json({ error: "This session has ended and is no longer active" })
    }

    res.json(session)
  } catch (error) {
    console.error("Verify QR code error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   PATCH /api/sessions/:id
// @desc    Update a session (e.g., deactivate)
// @access  Private (Teachers only)
router.patch("/:id", protect, authorize("TEACHER"), async (req, res) => {
  try {
    const { active, endTime } = req.body

    // Check if session exists and belongs to the teacher
    const session = await Session.findOne({
      _id: req.params.id,
      teacher: req.user._id,
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found or you do not have permission" })
    }

    // Update session
    if (active !== undefined) {
      session.active = active
    }

    if (endTime) {
      session.endTime = new Date(endTime)
    }

    await session.save()

    res.json(session)
  } catch (error) {
    console.error("Update session error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Add a new endpoint to refresh QR codes periodically
router.post("/:id/refresh", protect, authorize("TEACHER"), async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      teacher: req.user._id,
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found or you do not have permission" })
    }

    if (!session.active) {
      return res.status(400).json({ error: "Cannot refresh QR code for inactive session" })
    }

    // Generate a new QR code
    const course = await Course.findById(session.course)
    const newQrCode = generateQRCode(course._id, course.code)

    // Update session with new QR code
    session.qrCode = newQrCode
    session.lastRefreshed = new Date()
    await session.save()

    res.json({ qrCode: newQrCode })
  } catch (error) {
    console.error("Refresh QR code error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
