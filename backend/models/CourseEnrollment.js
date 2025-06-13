const mongoose = require("mongoose")

const CourseEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true },
)

// Ensure a student can only be enrolled once in a course
CourseEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true })

module.exports = mongoose.model("CourseEnrollment", CourseEnrollmentSchema)
