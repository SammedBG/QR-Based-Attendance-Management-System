"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import AuthContext from "../../context/AuthContext"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const SecuritySettings = () => {
  const { user } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [student, setStudent] = useState(null)
  const [deviceId, setDeviceId] = useState("")
  const [deviceName, setDeviceName] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [securityPreferences, setSecurityPreferences] = useState({
    requirePin: true,
    requireBiometric: true,
    requireDeviceVerification: true,
    requireSelfie: false,
  })

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true)
      try {
        const res = await axios.get("/api/auth/me")
        setStudent(res.data.profile)

        if (res.data.profile.securityPreferences) {
          setSecurityPreferences(res.data.profile.securityPreferences)
        }

        // Generate a device ID if not already stored
        let storedDeviceId = localStorage.getItem("deviceId")
        if (!storedDeviceId) {
          storedDeviceId = generateDeviceId()
          localStorage.setItem("deviceId", storedDeviceId)
        }
        setDeviceId(storedDeviceId)

        // Set default device name
        setDeviceName(navigator.userAgent.substring(0, 50))
      } catch (err) {
        setError("Failed to fetch student data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [])

  const generateDeviceId = () => {
    // Generate a random device ID
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const handlePreferenceChange = (e) => {
    setSecurityPreferences({
      ...securityPreferences,
      [e.target.name]: e.target.checked,
    })
  }

  const handleRegisterDevice = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await axios.post("/api/auth/register-device", {
        deviceId,
        deviceName,
      })

      setSuccess("Device registered successfully")
      setStudent({
        ...student,
        registeredDevices: res.data.devices,
      })
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register device")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSetPin = async (e) => {
    e.preventDefault()

    if (pin !== confirmPin) {
      setError("PINs do not match")
      return
    }

    if (pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post("/api/auth/set-pin", { pin })
      setSuccess("PIN set successfully")
      setPin("")
      setConfirmPin("")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set PIN")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await axios.post("/api/auth/update-security", {
        securityPreferences,
      })

      setSuccess("Security preferences updated successfully")
      setSecurityPreferences(res.data.securityPreferences)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update security preferences")
      console.error(err)
    } finally {
      setSaving(false)
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Security Settings</h1>
          <Link to="/student" className="btn btn-outline-primary">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Security Preferences</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSavePreferences}>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="requirePin"
                      name="requirePin"
                      checked={securityPreferences.requirePin}
                      onChange={handlePreferenceChange}
                    />
                    <label className="form-check-label" htmlFor="requirePin">
                      Require PIN verification
                    </label>
                    <small className="form-text text-muted d-block">
                      You'll need to enter your PIN when marking attendance
                    </small>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="requireBiometric"
                      name="requireBiometric"
                      checked={securityPreferences.requireBiometric}
                      onChange={handlePreferenceChange}
                    />
                    <label className="form-check-label" htmlFor="requireBiometric">
                      Require biometric verification
                    </label>
                    <small className="form-text text-muted d-block">
                      You'll need to use fingerprint or face ID when marking attendance
                    </small>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="requireDeviceVerification"
                      name="requireDeviceVerification"
                      checked={securityPreferences.requireDeviceVerification}
                      onChange={handlePreferenceChange}
                    />
                    <label className="form-check-label" htmlFor="requireDeviceVerification">
                      Require device verification
                    </label>
                    <small className="form-text text-muted d-block">
                      You can only mark attendance from registered devices
                    </small>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="requireSelfie"
                      name="requireSelfie"
                      checked={securityPreferences.requireSelfie}
                      onChange={handlePreferenceChange}
                    />
                    <label className="form-check-label" htmlFor="requireSelfie">
                      Require selfie verification
                    </label>
                    <small className="form-text text-muted d-block">
                      You'll need to take a selfie when marking attendance
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Set Attendance PIN</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSetPin}>
                  <div className="mb-3">
                    <label htmlFor="pin" className="form-label">
                      PIN (minimum 4 digits)
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="pin"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                      minLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPin" className="form-label">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPin"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      required
                      minLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Setting PIN..." : "Set PIN"}
                  </button>
                </form>
              </div>
            </div>

            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Register This Device</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleRegisterDevice}>
                  <div className="mb-3">
                    <label htmlFor="deviceName" className="form-label">
                      Device Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="deviceName"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="deviceId" className="form-label">
                      Device ID
                    </label>
                    <input type="text" className="form-control" id="deviceId" value={deviceId} readOnly />
                    <small className="form-text text-muted">This is a unique identifier for your device</small>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Registering..." : "Register Device"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {student?.registeredDevices && student.registeredDevices.length > 0 && (
          <div className="card mt-4">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Registered Devices</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Device Name</th>
                      <th>Last Used</th>
                      <th>Device ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.registeredDevices.map((device, index) => (
                      <tr key={index}>
                        <td>{device.deviceName}</td>
                        <td>{new Date(device.lastUsed).toLocaleString()}</td>
                        <td>
                          <small className="text-muted">{device.deviceId}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default SecuritySettings
