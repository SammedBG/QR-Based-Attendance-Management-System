"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import AuthContext from "../../context/AuthContext"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const AttendancePage = () => {
  const { qrCode } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState("idle") // idle, marking, success, error
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [locationVerified, setLocationVerified] = useState(false)
  const [verifyingLocation, setVerifyingLocation] = useState(false)

  // Security verification states
  const [securityPreferences, setSecurityPreferences] = useState(null)
  const [pin, setPin] = useState("")
  const [biometricVerified, setBiometricVerified] = useState(false)
  const [deviceId, setDeviceId] = useState("")
  const [deviceVerified, setDeviceVerified] = useState(false)
  const [selfieImage, setSelfieImage] = useState(null)
  const [takingSelfie, setTakingSelfie] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({})

  useEffect(() => {
    const verifyQRCode = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`/api/sessions/verify/${qrCode}`)
        setSession(res.data)

        // If session requires location verification, get user's location
        if (res.data.location && res.data.location.latitude && res.data.location.longitude) {
          getLocation()
        } else {
          setLocationVerified(true) // No location verification needed
        }

        // Get student security preferences
        const studentRes = await axios.get("/api/auth/me")
        if (studentRes.data.profile && studentRes.data.profile.securityPreferences) {
          setSecurityPreferences(studentRes.data.profile.securityPreferences)
        } else {
          // Default preferences if not set
          setSecurityPreferences({
            requirePin: true,
            requireBiometric: false,
            requireDeviceVerification: true,
            requireSelfie: false,
          })
        }

        // Get device ID from local storage
        const storedDeviceId = localStorage.getItem("deviceId")
        if (storedDeviceId) {
          setDeviceId(storedDeviceId)
        }

        // Collect device info
        collectDeviceInfo()
      } catch (err) {
        setError(err.response?.data?.error || "Invalid QR code or session not found")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    verifyQRCode()
  }, [qrCode])

  const collectDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
    setDeviceInfo(info)
  }

  const getLocation = () => {
    setVerifyingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setVerifyingLocation(false)

          // Verify if user is within the required radius
          if (session && session.location) {
            const distance = calculateDistance(
              position.coords.latitude,
              position.coords.longitude,
              session.location.latitude,
              session.location.longitude,
            )

            if (distance <= session.location.radius) {
              setLocationVerified(true)
            } else {
              setLocationError(
                `You are ${Math.round(distance)}m away from the classroom. You must be within ${session.location.radius}m to mark attendance.`,
              )
            }
          }
        },
        (err) => {
          setLocationError(
            `Error getting location: ${err.message}. Location verification is required for this session.`,
          )
          setVerifyingLocation(false)
          console.error("Error getting location:", err)
        },
      )
    } else {
      setLocationError(
        "Geolocation is not supported by this browser. Location verification is required for this session.",
      )
      setVerifyingLocation(false)
    }
  }

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

  const verifyBiometric = async () => {
    try {
      // Check if the browser supports the Web Authentication API
      if (!window.PublicKeyCredential) {
        alert("Your browser doesn't support biometric authentication. Please use a different verification method.")
        return
      }

      // Check if the device supports biometric authentication
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!available) {
        alert("Your device doesn't support biometric authentication. Please use a different verification method.")
        return
      }

      // Request biometric verification
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          userVerification: "required",
        },
      })

      if (credential) {
        setBiometricVerified(true)
        return true
      }
    } catch (error) {
      console.error("Biometric verification failed:", error)
      alert("Biometric verification failed. Please try again.")
    }
    return false
  }

  const startSelfieCapture = () => {
    setTakingSelfie(true)

    // Access the webcam
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
          alert("Could not access camera. Please check permissions.")
          setTakingSelfie(false)
        })
    } else {
      alert("Your browser doesn't support camera access.")
      setTakingSelfie(false)
    }
  }

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      context.drawImage(videoRef.current, 0, 0, 320, 240)

      // Convert canvas to base64 image
      const imageData = canvasRef.current.toDataURL("image/jpeg")
      setSelfieImage(imageData)

      // Stop the camera stream
      const stream = videoRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null

      setTakingSelfie(false)
    }
  }

  const markAttendance = async () => {
    // Verify all required security measures
    if (securityPreferences) {
      // 1. Verify biometrics if required
      if (securityPreferences.requireBiometric && !biometricVerified) {
        const verified = await verifyBiometric()
        if (!verified) return
      }

      // 2. Verify selfie if required
      if (securityPreferences.requireSelfie && !selfieImage) {
        startSelfieCapture()
        return
      }
    }

    setStatus("marking")
    try {
      // Include all verification data
      const attendanceData = {
        sessionId: session._id,
        status: "PRESENT",
        location,
        deviceId,
        deviceInfo,
        biometricVerified,
        selfieImage,
      }

      // Add PIN if required
      if (securityPreferences?.requirePin && pin) {
        attendanceData.pin = pin
      }

      const res = await axios.post("/api/attendance", attendanceData)
      setStatus("success")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark attendance")
      setStatus("error")
      console.error(err)
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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">Error</h4>
                </div>
                <div className="card-body text-center">
                  <p className="mb-4">{error}</p>
                  <Link to="/student" className="btn btn-primary">
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            {session && (
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">{session.course.name}</h4>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <p className="mb-1">
                      <strong>Course Code:</strong> {session.course.code}
                    </p>
                    <p className="mb-1">
                      <strong>Date:</strong> {new Date(session.date).toLocaleDateString()}
                    </p>
                    <p className="mb-1">
                      <strong>Start Time:</strong> {new Date(session.startTime).toLocaleTimeString()}
                    </p>
                    {session.endTime && (
                      <p className="mb-1">
                        <strong>End Time:</strong> {new Date(session.endTime).toLocaleTimeString()}
                      </p>
                    )}
                    <p className="mb-1">
                      <strong>Teacher:</strong> {session.teacher.name}
                    </p>

                    {session.location && session.location.latitude && (
                      <p className="mb-1">
                        <strong>Location Verification:</strong> Required (within {session.location.radius}m)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location Verification */}
            {session && session.location && session.location.latitude && !locationVerified && (
              <div className="card mb-4">
                <div className="card-header bg-warning text-dark">
                  <h4 className="mb-0">Location Verification Required</h4>
                </div>
                <div className="card-body text-center">
                  {locationError ? (
                    <div className="alert alert-danger">{locationError}</div>
                  ) : (
                    <>
                      <p>This session requires location verification to ensure you are physically present in class.</p>
                      {verifyingLocation ? (
                        <div className="d-flex justify-content-center mb-3">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Verifying location...</span>
                          </div>
                        </div>
                      ) : (
                        <button onClick={getLocation} className="btn btn-primary">
                          Verify My Location
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Selfie Capture */}
            {takingSelfie && (
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">Take a Selfie</h4>
                </div>
                <div className="card-body text-center">
                  <p>Please take a selfie to verify your identity.</p>
                  <div className="mb-3">
                    <video
                      ref={videoRef}
                      width="320"
                      height="240"
                      autoPlay
                      className="border rounded mx-auto d-block"
                    ></video>
                  </div>
                  <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }}></canvas>
                  <button onClick={captureSelfie} className="btn btn-primary">
                    Capture Selfie
                  </button>
                </div>
              </div>
            )}

            {/* PIN Verification */}
            {securityPreferences?.requirePin && status === "idle" && locationVerified && !takingSelfie && (
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">PIN Verification</h4>
                </div>
                <div className="card-body">
                  <p>Please enter your attendance PIN to verify your identity.</p>
                  <div className="mb-3">
                    <label htmlFor="pin" className="form-label">
                      PIN
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="pin"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter your PIN"
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Selfie Preview */}
            {selfieImage && (
              <div className="card mb-4">
                <div className="card-header bg-success text-white">
                  <h4 className="mb-0">Selfie Captured</h4>
                </div>
                <div className="card-body text-center">
                  <img
                    src={selfieImage || "/placeholder.svg"}
                    alt="Selfie"
                    className="border rounded mb-3"
                    style={{ maxWidth: "100%" }}
                  />
                </div>
              </div>
            )}

            {status === "idle" && locationVerified && !takingSelfie && (
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">Mark Attendance</h4>
                </div>
                <div className="card-body text-center">
                  <p className="mb-4">Hi {user.name}, confirm your attendance for this class session.</p>
                  <button onClick={markAttendance} className="btn btn-primary btn-lg">
                    Mark My Attendance
                  </button>
                </div>
              </div>
            )}

            {status === "marking" && (
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">Processing</h4>
                </div>
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center mb-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <p>Marking your attendance...</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  <h4 className="mb-0">Attendance Marked!</h4>
                </div>
                <div className="card-body text-center">
                  <div className="mb-4">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "4rem" }}></i>
                  </div>
                  <p className="mb-4">Your attendance has been successfully recorded.</p>
                  <div className="card mb-4">
                    <div className="card-body">
                      <p className="mb-1">
                        <strong>Name:</strong> {user.name}
                      </p>
                      <p className="mb-1">
                        <strong>Course:</strong> {session.course.name} ({session.course.code})
                      </p>
                      <p className="mb-1">
                        <strong>Time:</strong> {new Date().toLocaleTimeString()}
                      </p>
                      <p className="mb-1">
                        <strong>Status:</strong> <span className="badge bg-success">PRESENT</span>
                      </p>
                    </div>
                  </div>
                  <Link to="/student" className="btn btn-primary">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">Error</h4>
                </div>
                <div className="card-body text-center">
                  <p className="mb-4">{error}</p>
                  <button onClick={markAttendance} className="btn btn-primary me-2">
                    Try Again
                  </button>
                  <Link to="/student" className="btn btn-outline-secondary">
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AttendancePage
