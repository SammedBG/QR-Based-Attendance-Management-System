"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const GenerateQR = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [countdown, setCountdown] = useState(refreshInterval)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const refreshTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  const [formData, setFormData] = useState({
    courseId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(new Date(), "HH:mm"),
    endTime: "",
    useLocation: true,
    locationRadius: 100, // meters
  })

  const { courseId, date, startTime, endTime, useLocation, locationRadius } = formData

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/courses")
        setCourses(res.data)
      } catch (err) {
        setError("Failed to fetch courses")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (err) => {
          setLocationError(`Error getting location: ${err.message}`)
          console.error("Error getting location:", err)
        },
      )
    } else {
      setLocationError("Geolocation is not supported by this browser")
    }

    // Cleanup timers on unmount
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [])

  // Handle QR code refresh
  useEffect(() => {
    if (qrData && qrData._id) {
      // Clear any existing timers
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

      // Set up QR code refresh timer
      refreshTimerRef.current = setInterval(() => {
        refreshQRCode(qrData._id)
        setCountdown(refreshInterval)
      }, refreshInterval * 1000)

      // Set up countdown timer
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)

      // Initialize countdown
      setCountdown(refreshInterval)
    }

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [qrData, refreshInterval])

  const onChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })

    if (e.target.name === "courseId") {
      const course = courses.find((c) => c._id === e.target.value)
      setSelectedCourse(course)
    }
  }

  const refreshQRCode = async (sessionId) => {
    try {
      const res = await axios.post(`/api/sessions/${sessionId}/refresh`)
      setQrData({ ...qrData, qrCode: res.data.qrCode, lastRefreshed: new Date() })
    } catch (err) {
      console.error("Error refreshing QR code:", err)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setError(null)

    try {
      // Create proper date objects
      const dateStr = formData.date
      const startTimeStr = formData.startTime

      // Combine date and time strings
      const startDateTime = new Date(`${dateStr}T${startTimeStr}`)

      // Create a modified form data with proper date objects
      const modifiedFormData = {
        ...formData,
        startTime: startDateTime.toISOString(),
        endTime: formData.endTime ? new Date(`${dateStr}T${formData.endTime}`).toISOString() : "",
      }

      // Add location data if enabled
      if (useLocation && location) {
        modifiedFormData.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: Number.parseInt(locationRadius, 10),
        }
      }

      const res = await axios.post("/api/sessions", modifiedFormData)
      setQrData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate QR code")
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const getQRUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/attendance/${qrData.qrCode}`
  }

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas")
    if (!canvas) return

    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")

    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = `qr-${selectedCourse?.code}-${date}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const handleRefreshIntervalChange = (e) => {
    const newInterval = Number.parseInt(e.target.value, 10)
    setRefreshInterval(newInterval)

    // Reset timers with new interval
    if (qrData && qrData._id) {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

      refreshTimerRef.current = setInterval(() => {
        refreshQRCode(qrData._id)
        setCountdown(newInterval)
      }, newInterval * 1000)

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)

      setCountdown(newInterval)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-5">
          <Spinner />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="mb-4">
          <Link to="/teacher" className="btn btn-outline-secondary">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="row">
          <div className="col-md-8 mx-auto">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Generate QR Code</h4>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {locationError && useLocation && (
                  <div className="alert alert-warning" role="alert">
                    {locationError}
                  </div>
                )}

                {!qrData ? (
                  <form onSubmit={onSubmit}>
                    <div className="mb-3">
                      <label htmlFor="courseId" className="form-label">
                        Course
                      </label>
                      <select
                        className="form-select"
                        id="courseId"
                        name="courseId"
                        value={courseId}
                        onChange={onChange}
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.name} ({course.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label htmlFor="date" className="form-label">
                          Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="date"
                          name="date"
                          value={date}
                          onChange={onChange}
                          required
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label htmlFor="startTime" className="form-label">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          id="startTime"
                          name="startTime"
                          value={startTime}
                          onChange={onChange}
                          required
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label htmlFor="endTime" className="form-label">
                          End Time (Optional)
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          id="endTime"
                          name="endTime"
                          value={endTime}
                          onChange={onChange}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="useLocation"
                          name="useLocation"
                          checked={useLocation}
                          onChange={onChange}
                        />
                        <label className="form-check-label" htmlFor="useLocation">
                          Require Location Verification
                        </label>
                      </div>
                      <small className="text-muted">
                        Students must be physically present within the specified radius to mark attendance
                      </small>
                    </div>

                    {useLocation && (
                      <div className="mb-3">
                        <label htmlFor="locationRadius" className="form-label">
                          Location Radius (meters)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="locationRadius"
                          name="locationRadius"
                          value={locationRadius}
                          onChange={onChange}
                          min="10"
                          max="1000"
                        />
                        <small className="text-muted">
                          Students must be within this distance from the classroom to mark attendance
                        </small>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100" disabled={generating}>
                      {generating ? "Generating..." : "Generate QR Code"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center">
                    <h5 className="mb-3">QR Code Generated</h5>
                    <div className="mb-3">
                      <QRCodeSVG
                        id="qr-code"
                        value={getQRUrl()}
                        size={240}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="L"
                        includeMargin={false}
                      />
                      <canvas id="qr-canvas" style={{ display: "none" }} width="240" height="240"></canvas>
                    </div>

                    <div className="alert alert-info">
                      <strong>Security Feature:</strong> QR code will refresh in{" "}
                      <span className="badge bg-primary">{countdown}</span> seconds
                    </div>

                    <div className="mb-3">
                      <label htmlFor="refreshInterval" className="form-label">
                        QR Code Refresh Interval (seconds)
                      </label>
                      <select
                        className="form-select"
                        id="refreshInterval"
                        value={refreshInterval}
                        onChange={handleRefreshIntervalChange}
                      >
                        <option value="15">15 seconds</option>
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="120">2 minutes</option>
                        <option value="300">5 minutes</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <p className="mb-1">
                        <strong>Course:</strong> {selectedCourse?.name} ({selectedCourse?.code})
                      </p>
                      <p className="mb-1">
                        <strong>Date:</strong> {new Date(qrData.date).toLocaleDateString()}
                      </p>
                      <p className="mb-1">
                        <strong>Start Time:</strong> {new Date(qrData.startTime).toLocaleTimeString()}
                      </p>
                      {qrData.endTime && (
                        <p className="mb-1">
                          <strong>End Time:</strong> {new Date(qrData.endTime).toLocaleTimeString()}
                        </p>
                      )}
                      {qrData.location && (
                        <p className="mb-1">
                          <strong>Location Verification:</strong> Enabled (Radius: {qrData.location.radius}m)
                        </p>
                      )}
                      <p className="mb-1">
                        <strong>URL:</strong> <small>{getQRUrl()}</small>
                      </p>
                    </div>

                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-outline-primary" onClick={() => window.print()}>
                        Print QR Code
                      </button>
                      <button className="btn btn-outline-primary" onClick={downloadQR}>
                        Download
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setQrData(null)
                          setFormData({
                            ...formData,
                            date: format(new Date(), "yyyy-MM-dd"),
                            startTime: format(new Date(), "HH:mm"),
                            endTime: "",
                          })
                          // Clear timers
                          if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
                          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
                        }}
                      >
                        Generate Another
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GenerateQR
