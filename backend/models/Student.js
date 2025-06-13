const mongoose = require("mongoose")

const StudentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    usn: {
      type: String,
      required: true,
      unique: true,
    },
    regNo: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    pin: {
      type: String,
      select: false, // Don't include in query results by default
    },
    registeredDevices: [
      {
        deviceId: String,
        deviceName: String,
        lastUsed: Date,
      },
    ],
    securityPreferences: {
      requirePin: {
        type: Boolean,
        default: true,
      },
      requireBiometric: {
        type: Boolean,
        default: true,
      },
      requireDeviceVerification: {
        type: Boolean,
        default: true,
      },
      requireSelfie: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Student", StudentSchema)
