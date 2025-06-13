const express = require("express")
const router = express.Router()
const Course = require("../models/Course")
const Teacher = require("../models/Teacher")
const CourseEnrollment = require("../models/CourseEnrollment")
const { protect, authorize } = require("../middleware/auth")
const Student = require("../models/Student") // Import Student model

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Teachers only)
router.post("/", protect, authorize("TEACHER"), async (req, res) => {
  try {
    const { name, code, section, semester } = req.body

    // Get teacher profile
    const teacher = await Teacher.findOne({ user: req.user._id })
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" })
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code })
    if (existingCourse) {
      return res.status(400).json({ error: "Course with this code already exists" })
    }

    // Create course
    const course = await Course.create({
      name,
      code,
      section,
      semester,
      teacher: teacher._id,
    })

    res.status(201).json(course)
  } catch (error) {
    console.error("Create course error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/courses
// @desc    Get all courses (filtered by user role)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let courses = []
    const { semester } = req.query

    const query = {}
    if (semester) {
      query.semester = semester
    }

    if (req.user.userType === "TEACHER") {
      // Get teacher's courses
      const teacher = await Teacher.findOne({ user: req.user._id })
      if (!teacher) {
        return res.status(404).json({ error: "Teacher profile not found" })
      }

      query.teacher = teacher._id
      courses = await Course.find(query)
        .populate("teacher", "employeeId department")
        .populate({
          path: "teacher",
          populate: {
            path: "user",
            select: "name email",
          },
        })
    } else if (req.user.userType === "STUDENT") {
      // Get student's enrolled courses
      const student = await Student.findOne({ user: req.user._id })
      if (!student) {
        return res.status(404).json({ error: "Student profile not found" })
      }

      const enrollments = await CourseEnrollment.find({ student: student._id })
      const courseIds = enrollments.map((enrollment) => enrollment.course)

      if (semester) {
        courses = await Course.find({ _id: { $in: courseIds }, semester })
          .populate("teacher", "employeeId department")
          .populate({
            path: "teacher",
            populate: {
              path: "user",
              select: "name email",
            },
          })
      } else {
        courses = await Course.find({ _id: { $in: courseIds } })
          .populate("teacher", "employeeId department")
          .populate({
            path: "teacher",
            populate: {
              path: "user",
              select: "name email",
            },
          })
      }
    } else if (req.user.userType === "ADMIN") {
      // Admins can see all courses
      courses = await Course.find(query)
        .populate("teacher", "employeeId department")
        .populate({
          path: "teacher",
          populate: {
            path: "user",
            select: "name email",
          },
        })
    }

    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/courses/:id
// @desc    Get a course by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "employeeId department")
      .populate({
        path: "teacher",
        populate: {
          path: "user",
          select: "name email",
        },
      })

    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }

    // Check if user has access to this course
    if (req.user.userType === "TEACHER") {
      const teacher = await Teacher.findOne({ user: req.user._id })
      if (!teacher || course.teacher._id.toString() !== teacher._id.toString()) {
        return res.status(403).json({ error: "Not authorized to access this course" })
      }
    } else if (req.user.userType === "STUDENT") {
      const student = await Student.findOne({ user: req.user._id })
      if (!student) {
        return res.status(404).json({ error: "Student profile not found" })
      }

      const enrollment = await CourseEnrollment.findOne({
        student: student._id,
        course: course._id,
      })

      if (!enrollment) {
        return res.status(403).json({ error: "Not enrolled in this course" })
      }
    }

    res.json(course)
  } catch (error) {
    console.error("Get course error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/courses/available
// @desc    Get all available courses for enrollment
// @access  Private (Students only)
router.get("/available/all", protect, authorize("STUDENT"), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" })
    }

    // Get courses the student is already enrolled in
    const enrollments = await CourseEnrollment.find({ student: student._id })
    const enrolledCourseIds = enrollments.map((enrollment) => enrollment.course.toString())

    // Find courses in the student's semester that they're not already enrolled in
    const availableCourses = await Course.find({
      semester: student.semester,
      _id: { $nin: enrolledCourseIds },
    }).populate({
      path: "teacher",
      populate: {
        path: "user",
        select: "name email",
      },
    })

    res.json(availableCourses)
  } catch (error) {
    console.error("Get available courses error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST /api/courses/:id/enroll
// @desc    Enroll a student in a course
// @access  Private (Students only)
router.post("/:id/enroll", protect, authorize("STUDENT"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }

    const student = await Student.findOne({ user: req.user._id })
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" })
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      student: student._id,
      course: course._id,
    })

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled in this course" })
    }

    // Create enrollment
    const enrollment = await CourseEnrollment.create({
      student: student._id,
      course: course._id,
    })

    res.status(201).json(enrollment)
  } catch (error) {
    console.error("Enroll in course error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
