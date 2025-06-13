const mongoose = require("mongoose")

const SessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastRefreshed: {
      type: Date,
      default: Date.now,
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      radius: {
        type: Number,
        default: 100, // Default radius in meters
      },
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Session", SessionSchema)
