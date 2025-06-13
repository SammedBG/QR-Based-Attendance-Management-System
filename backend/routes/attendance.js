const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const AttendanceRecord = require("../models/AttendanceRecord")
const Session = require("../models/Session")
const Student = require("../models/Student")
const CourseEnrollment = require("../models/CourseEnrollment")
const Course = require("../models/Course") // Import Course model
const { protect } = require("../middleware/auth")

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance // Distance in meters
}

// @route   POST /api/attendance
// @desc    Mark attendance
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { sessionId, studentId, status, location, deviceId, pin, biometricVerified, selfieImage, deviceInfo } =
      req.body

    // If studentId is not provided, use the current user (for students marking their own attendance)
    const attendeeId = studentId || req.user._id

    // Check if session exists and is active
    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    if (!session.active) {
      return res.status(400).json({ error: "Session is no longer active" })
    }

    // Check if QR code has expired (if it was refreshed more than 2 minutes ago)
    const qrExpiration = 2 * 60 * 1000 // 2 minutes in milliseconds
    if (session.lastRefreshed && Date.now() - new Date(session.lastRefreshed).getTime() > qrExpiration) {
      return res.status(400).json({ error: "QR code has expired. Please scan the latest QR code." })
    }

    // Verify location if session has location requirements
    if (session.location && session.location.latitude && session.location.longitude) {
      // If student didn't provide location
      if (!location || !location.latitude || !location.longitude) {
        return res.status(400).json({ error: "Location verification is required for this session" })
      }

      // Calculate distance between student and classroom
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        session.location.latitude,
        session.location.longitude,
      )

      // Check if student is within the required radius
      if (distance > session.location.radius) {
        return res.status(400).json({
          error: `You are ${Math.round(distance)}m away from the classroom. You must be within ${session.location.radius}m to mark attendance.`,
        })
      }
    }

    // Check if student exists
    const student = await Student.findOne({ user: attendeeId }).select("+pin")
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    // Check if student is enrolled in the course
    const course = await Course.findById(session.course)
    const enrollment = await CourseEnrollment.findOne({
      student: student._id,
      course: session.course,
    })

    if (!enrollment && req.user.userType !== "TEACHER") {
      return res.status(400).json({ error: "Student is not enrolled in this course" })
    }

    // Check if attendance already marked
    const existingRecord = await AttendanceRecord.findOne({
      session: sessionId,
      student: attendeeId,
    })

    if (existingRecord) {
      return res.status(400).json({ error: "Attendance already marked for this student" })
    }

    // Security verification checks
    let verificationMethod = "NONE"

    // 1. Device verification
    if (student.securityPreferences.requireDeviceVerification) {
      if (!deviceId) {
        return res.status(400).json({ error: "Device verification is required" })
      }

      const registeredDevice = student.registeredDevices.find((device) => device.deviceId === deviceId)

      if (!registeredDevice) {
        return res.status(400).json({
          error:
            "Unrecognized device. Please use a registered device or register this device in your profile settings.",
        })
      }

      // Update last used timestamp
      registeredDevice.lastUsed = new Date()
      await student.save()

      verificationMethod = "DEVICE"
    }

    // 2. PIN verification
    if (student.securityPreferences.requirePin) {
      if (!pin) {
        return res.status(400).json({ error: "PIN verification is required" })
      }

      if (!student.pin) {
        return res.status(400).json({ error: "You need to set up a PIN in your profile settings first" })
      }

      const isPinValid = await bcrypt.compare(pin, student.pin)
      if (!isPinValid) {
        return res.status(400).json({ error: "Invalid PIN" })
      }

      verificationMethod = "PIN"
    }

    // 3. Biometric verification
    if (student.securityPreferences.requireBiometric) {
      if (!biometricVerified) {
        return res.status(400).json({ error: "Biometric verification is required" })
      }

      verificationMethod = "BIOMETRIC"
    }

    // 4. Selfie verification
    if (student.securityPreferences.requireSelfie) {
      if (!selfieImage) {
        return res.status(400).json({ error: "Selfie verification is required" })
      }

      verificationMethod = "SELFIE"
    }

    // Mark attendance
    const record = await AttendanceRecord.create({
      session: sessionId,
      student: attendeeId,
      status: status || "PRESENT",
      timestamp: new Date(),
      locationVerified: session.location ? true : false,
      deviceId,
      deviceInfo,
      verificationMethod,
      biometricVerified: !!biometricVerified,
      selfieImage,
      ipAddress: req.ip,
    })

    // Populate student and session details
    await record.populate([
      {
        path: "student",
        select: "name email",
      },
      {
        path: "session",
        populate: {
          path: "course",
          select: "name code",
        },
      },
    ])

    res.status(201).json(record)
  } catch (error) {
    console.error("Mark attendance error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/attendance
// @desc    Get attendance records (filtered by user role)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { sessionId, courseId, studentId, limit } = req.query

    const query = {}

    if (sessionId) {
      query.session = sessionId
    }

    if (courseId) {
      const sessions = await Session.find({ course: courseId }).select("_id")
      query.session = { $in: sessions.map((s) => s._id) }
    }

    if (studentId) {
      query.student = studentId
    }

    // For students, only show their own records
    if (req.user.userType === "STUDENT") {
      query.student = req.user._id
    }

    // For teachers, only show records for their sessions
    if (req.user.userType === "TEACHER") {
      const sessions = await Session.find({ teacher: req.user._id }).select("_id")
      query.session = { $in: sessions.map((s) => s._id) }
    }

    let records = AttendanceRecord.find(query)
      .populate({
        path: "student",
        select: "name email",
      })
      .populate({
        path: "session",
        populate: {
          path: "course",
          select: "name code",
        },
      })
      .sort({ timestamp: -1 })

    if (limit) {
      records = records.limit(Number.parseInt(limit))
    }

    records = await records

    res.json(records)
  } catch (error) {
    console.error("Get attendance records error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
