const mongoose = require("mongoose")

const TeacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Teacher", TeacherSchema)
