const mongoose = require("mongoose")

const AttendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE"],
      default: "PRESENT",
    },
    locationVerified: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
    },
    deviceInfo: {
      type: Object,
      default: {},
    },
    verificationMethod: {
      type: String,
      enum: ["PIN", "BIOMETRIC", "DEVICE", "SELFIE", "NONE"],
      default: "NONE",
    },
    deviceId: {
      type: String,
    },
    selfieImage: {
      type: String,
    },
    biometricVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// Ensure a student can only have one attendance record per session
AttendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true })

module.exports = mongoose.model("AttendanceRecord", AttendanceRecordSchema)
