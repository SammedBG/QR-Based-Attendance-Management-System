const express = require("express")
const router = express.Router()
const AttendanceRecord = require("../models/AttendanceRecord")
const Session = require("../models/Session")
const Course = require("../models/Course")
const CourseEnrollment = require("../models/CourseEnrollment")
const User = require("../models/User")
const { protect } = require("../middleware/auth")
const Student = require("../models/Student")
const Teacher = require("../models/Teacher")

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date()
  let startDate, endDate

  switch (period) {
    case "lastWeek":
      endDate = new Date(now)
      endDate.setDate(now.getDate() - (now.getDay() + 1))
      endDate.setHours(23, 59, 59, 999)

      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
      break

    case "thisMonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      break

    case "lastMonth":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      break

    case "thisWeek":
    default:
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
  }

  return { startDate, endDate }
}

// @route   GET /api/analytics/attendance
// @desc    Get attendance analytics
// @access  Private
router.get("/attendance", protect, async (req, res) => {
  try {
    const { period = "thisWeek", teacherId, studentId } = req.query

    // Get date range
    const { startDate, endDate } = getDateRange(period)

    // Build query
    const query = {
      timestamp: { $gte: startDate, $lte: endDate },
    }

    if (teacherId) {
      const teacherSessions = await Session.find({ teacher: teacherId }).select("_id")
      query.session = { $in: teacherSessions.map((s) => s._id) }
    }

    if (studentId) {
      query.student = studentId
    }

    // For students, only show their own records
    if (req.user.userType === "STUDENT") {
      query.student = req.user._id
    }

    // For teachers, only show records for their sessions
    if (req.user.userType === "TEACHER" && !teacherId) {
      const teacherSessions = await Session.find({ teacher: req.user._id }).select("_id")
      query.session = { $in: teacherSessions.map((s) => s._id) }
    }

    // Get attendance records
    const records = await AttendanceRecord.find(query).populate({
      path: "session",
      select: "date",
    })

    // Calculate attendance percentage for each day
    const dailyData = []
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)

      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      // Get records for this day
      const dayRecords = records.filter((record) => {
        const recordDate = new Date(record.timestamp)
        return recordDate >= dayStart && recordDate <= dayEnd
      })

      // Calculate percentage (simplified for demo)
      // In a real app, you'd calculate based on total possible attendances
      const attendancePercentage = dayRecords.length > 0 ? Math.min(100, dayRecords.length * 10) : 0

      dailyData.push({
        name: days[day.getDay()],
        attendance: attendancePercentage,
      })
    }

    res.json(dailyData)
  } catch (error) {
    console.error("Get attendance analytics error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/analytics/summary
// @desc    Get attendance summary
// @access  Private
router.get("/summary", protect, async (req, res) => {
  try {
    // For teachers
    if (req.user.userType === "TEACHER") {
      // Get teacher's courses
      const courses = await Course.find({ teacher: req.user._id })
      const courseIds = courses.map((course) => course._id)

      // Get total students enrolled
      const enrollments = await CourseEnrollment.find({ course: { $in: courseIds } })
      const uniqueStudentIds = [...new Set(enrollments.map((e) => e.student.toString()))]

      // Get active sessions
      const activeSessions = await Session.countDocuments({
        teacher: req.user._id,
        active: true,
      })

      // Get today's attendance percentage
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayEnd = new Date(today)
      todayEnd.setHours(23, 59, 59, 999)

      // Default values if no data
      let todayAttendancePercentage = 0

      // Only calculate if there are students enrolled
      if (uniqueStudentIds.length > 0) {
        const todaySessions = await Session.find({
          teacher: req.user._id,
          date: { $gte: today, $lte: todayEnd },
        })

        if (todaySessions.length > 0) {
          const totalPossibleAttendances = uniqueStudentIds.length * todaySessions.length

          const todayAttendanceRecords = await AttendanceRecord.countDocuments({
            session: { $in: todaySessions.map((s) => s._id) },
            timestamp: { $gte: today, $lte: todayEnd },
          })

          if (totalPossibleAttendances > 0) {
            todayAttendancePercentage = Math.round((todayAttendanceRecords / totalPossibleAttendances) * 100)
          }
        }
      }

      res.json({
        totalStudents: uniqueStudentIds.length,
        totalCourses: courses.length,
        activeSessions,
        todayAttendancePercentage,
      })
    }
    // For students
    else if (req.user.userType === "STUDENT") {
      // Get student's courses
      const student = await Student.findOne({ user: req.user._id })

      if (!student) {
        return res.status(404).json({ error: "Student profile not found" })
      }

      const enrollments = await CourseEnrollment.find({ student: student._id })
      const courseIds = enrollments.map((enrollment) => enrollment.course)

      // Get total courses
      const totalCourses = courseIds.length

      // Get active sessions for student's courses
      const activeSessions = await Session.countDocuments({
        course: { $in: courseIds },
        active: true,
      })

      // Get attendance percentage
      const allSessions = await Session.find({ course: { $in: courseIds } })
      const totalSessions = allSessions.length

      const attendedSessions = await AttendanceRecord.countDocuments({
        student: req.user._id,
        session: { $in: allSessions.map((s) => s._id) },
      })

      let attendancePercentage = 0
      if (totalSessions > 0) {
        attendancePercentage = Math.round((attendedSessions / totalSessions) * 100)
      }

      res.json({
        totalCourses,
        activeSessions,
        totalSessions,
        attendedSessions,
        attendancePercentage,
      })
    } else {
      res.status(403).json({ error: "Unauthorized" })
    }
  } catch (error) {
    console.error("Get summary error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/analytics/course-attendance
// @desc    Get attendance by course
// @access  Private
router.get("/course-attendance", protect, async (req, res) => {
  try {
    const { studentId, period } = req.query

    // Get date range if period is specified
    let dateQuery = {}
    if (period) {
      const { startDate, endDate } = getDateRange(period)
      dateQuery = { date: { $gte: startDate, $lte: endDate } }
    }

    // For teachers, get attendance for all courses they teach
    if (req.user.userType === "TEACHER") {
      // Get teacher's courses
      const teacher = await Teacher.findOne({ user: req.user._id })
      if (!teacher) {
        return res.status(404).json({ error: "Teacher profile not found" })
      }

      const courses = await Course.find({ teacher: teacher._id })
      const courseIds = courses.map((course) => course._id)

      const courseAttendance = []

      for (const course of courses) {
        // Get all sessions for this course
        const sessions = await Session.find({
          course: course._id,
          ...dateQuery,
        })

        const sessionIds = sessions.map((s) => s._id)

        // Get all enrollments for this course
        const enrollments = await CourseEnrollment.find({ course: course._id })
        const studentIds = enrollments.map((e) => e.student)

        // Get total possible attendances (students × sessions)
        const totalPossible = studentIds.length * sessions.length

        // Get actual attendances
        const actualAttendances = await AttendanceRecord.countDocuments({
          session: { $in: sessionIds },
          status: "PRESENT",
        })

        // Calculate percentage
        const attendancePercentage = totalPossible > 0 ? Math.round((actualAttendances / totalPossible) * 100) : 0

        courseAttendance.push({
          _id: course._id,
          name: course.name,
          code: course.code,
          totalSessions: sessions.length,
          totalStudents: studentIds.length,
          attendancePercentage,
        })
      }

      res.json(courseAttendance)
    }
    // For students, get their attendance for each course
    else if (req.user.userType === "STUDENT") {
      const targetStudentId = studentId || req.user._id

      // Get student's courses
      const student = await Student.findOne({ user: targetStudentId })

      if (!student) {
        return res.status(404).json({ error: "Student profile not found" })
      }

      const enrollments = await CourseEnrollment.find({ student: student._id })
      const courseIds = enrollments.map((e) => e.course)

      const courseAttendance = []

      for (const courseId of courseIds) {
        const course = await Course.findById(courseId)

        // Get all sessions for this course
        const sessions = await Session.find({
          course: courseId,
          ...dateQuery,
        })

        const sessionIds = sessions.map((s) => s._id)

        // Get attended sessions
        const attendedSessions = await AttendanceRecord.countDocuments({
          session: { $in: sessionIds },
          student: targetStudentId,
          status: "PRESENT",
        })

        // Calculate percentage
        const attendancePercentage = sessions.length > 0 ? Math.round((attendedSessions / sessions.length) * 100) : 0

        courseAttendance.push({
          _id: course._id,
          name: course.name,
          code: course.code,
          totalSessions: sessions.length,
          attendedSessions,
          attendancePercentage,
        })
      }

      res.json(courseAttendance)
    } else {
      res.status(403).json({ error: "Unauthorized" })
    }
  } catch (error) {
    console.error("Get course attendance error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/analytics/daily-attendance
// @desc    Get attendance by day for a specific course
// @access  Private
router.get("/daily-attendance", protect, async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate } = req.query

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" })
    }

    // Validate date range
    let start, end
    if (startDate) {
      start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
    } else {
      // Default to last 30 days
      start = new Date()
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
    }

    if (endDate) {
      end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
    } else {
      end = new Date()
      end.setHours(23, 59, 59, 999)
    }

    // Check if user has access to this course
    if (req.user.userType === "TEACHER") {
      const teacher = await Teacher.findOne({ user: req.user._id })
      if (!teacher) {
        return res.status(404).json({ error: "Teacher profile not found" })
      }

      const course = await Course.findOne({
        _id: courseId,
        teacher: teacher._id,
      })

      if (!course) {
        return res.status(403).json({ error: "Not authorized to access this course" })
      }
    } else if (req.user.userType === "STUDENT") {
      const student = await Student.findOne({ user: req.user._id })

      if (!student) {
        return res.status(404).json({ error: "Student profile not found" })
      }

      const enrollment = await CourseEnrollment.findOne({
        student: student._id,
        course: courseId,
      })

      if (!enrollment) {
        return res.status(403).json({ error: "Not enrolled in this course" })
      }
    }

    // Get all sessions for this course in the date range
    const sessions = await Session.find({
      course: courseId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 })

    const dailyAttendance = []

    for (const session of sessions) {
      const attendanceQuery = {
        session: session._id,
        status: "PRESENT",
      }

      // If studentId is provided, get attendance for that student only
      if (studentId) {
        attendanceQuery.student = studentId
      }

      // Get attendance records for this session
      const attendanceCount = await AttendanceRecord.countDocuments(attendanceQuery)

      // If looking at a specific student, the count will be 0 or 1
      // If looking at all students, get the total enrolled for percentage calculation
      let totalStudents = 1
      let attendancePercentage = 0

      if (!studentId) {
        const enrollments = await CourseEnrollment.countDocuments({ course: courseId })
        totalStudents = enrollments
        attendancePercentage = totalStudents > 0 ? Math.round((attendanceCount / totalStudents) * 100) : 0
      } else {
        attendancePercentage = attendanceCount > 0 ? 100 : 0
      }

      dailyAttendance.push({
        date: session.date,
        sessionId: session._id,
        attendanceCount,
        totalStudents,
        attendancePercentage,
        present: attendanceCount > 0,
      })
    }

    res.json(dailyAttendance)
  } catch (error) {
    console.error("Get daily attendance error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET /api/analytics/student-attendance
// @desc    Get attendance for all students in a course
// @access  Private (Teachers only)
router.get("/student-attendance", protect, async (req, res) => {
  try {
    if (req.user.userType !== "TEACHER") {
      return res.status(403).json({ error: "Only teachers can access this endpoint" })
    }

    const { courseId, startDate, endDate } = req.query

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" })
    }

    // Validate course belongs to teacher
    const teacher = await Teacher.findOne({ user: req.user._id })
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" })
    }

    const course = await Course.findOne({
      _id: courseId,
      teacher: teacher._id,
    })

    if (!course) {
      return res.status(403).json({ error: "Not authorized to access this course" })
    }

    // Validate date range
    let start, end
    if (startDate) {
      start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
    } else {
      // Default to beginning of semester
      start = new Date()
      start.setMonth(start.getMonth() - 4) // Approximately one semester back
      start.setHours(0, 0, 0, 0)
    }

    if (endDate) {
      end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
    } else {
      end = new Date()
      end.setHours(23, 59, 59, 999)
    }

    // Get all sessions for this course in the date range
    const sessions = await Session.find({
      course: courseId,
      date: { $gte: start, $lte: end },
    })

    const sessionIds = sessions.map((s) => s._id)
    const totalSessions = sessions.length

    // Get all students enrolled in this course
    const enrollments = await CourseEnrollment.find({ course: courseId }).populate({
      path: "student",
      populate: {
        path: "user",
        select: "name email",
      },
    })

    const studentAttendance = []

    for (const enrollment of enrollments) {
      // Get attendance records for this student
      const attendanceRecords = await AttendanceRecord.find({
        session: { $in: sessionIds },
        student: enrollment.student.user._id,
        status: "PRESENT",
      })

      const attendedSessions = attendanceRecords.length

      // Calculate percentage
      const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0

      studentAttendance.push({
        studentId: enrollment.student.user._id,
        studentName: enrollment.student.user.name,
        email: enrollment.student.user.email,
        totalSessions,
        attendedSessions,
        attendancePercentage,
      })
    }

    // Sort by attendance percentage (descending)
    studentAttendance.sort((a, b) => b.attendancePercentage - a.attendancePercentage)

    res.json(studentAttendance)
  } catch (error) {
    console.error("Get student attendance error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
