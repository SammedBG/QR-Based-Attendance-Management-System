"use client"

import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import axios from "axios"
import { QRCodeSVG } from "qrcode.react"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const SessionDetails = () => {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSessionData = async () => {
      setLoading(true)
      try {
        // Fetch session details
        const sessionRes = await axios.get(`/api/sessions/${id}`)
        setSession(sessionRes.data)

        // Fetch attendance records for this session
        const attendanceRes = await axios.get(`/api/attendance?sessionId=${id}`)
        setAttendanceRecords(attendanceRes.data)
      } catch (err) {
        setError("Failed to fetch session details")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [id])

  const handleDeactivateSession = async () => {
    try {
      await axios.patch(`/api/sessions/${id}`, {
        active: false,
        endTime: new Date().toISOString(),
      })

      // Update the session state
      setSession({
        ...session,
        active: false,
        endTime: new Date().toISOString(),
      })
    } catch (err) {
      setError("Failed to end session")
      console.error(err)
    }
  }

  const getQRUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/attendance/${session.qrCode}`
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

  if (error || !session) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-danger" role="alert">
            {error || "Session not found"}
          </div>
          <Link to="/teacher/sessions" className="btn btn-primary">
            Back to Sessions
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="mb-4">
          <Link to="/teacher/sessions" className="btn btn-outline-secondary">
            &larr; Back to Sessions
          </Link>
        </div>

        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Session Details</h4>
              </div>
              <div className="card-body">
                <p className="mb-2">
                  <strong>Course:</strong> {session.course.name} ({session.course.code})
                </p>
                <p className="mb-2">
                  <strong>Date:</strong> {new Date(session.date).toLocaleDateString()}
                </p>
                <p className="mb-2">
                  <strong>Start Time:</strong> {new Date(session.startTime).toLocaleTimeString()}
                </p>
                {session.endTime && (
                  <p className="mb-2">
                    <strong>End Time:</strong> {new Date(session.endTime).toLocaleTimeString()}
                  </p>
                )}
                <p className="mb-2">
                  <strong>Status:</strong>{" "}
                  <span className={`badge bg-${session.active ? "success" : "secondary"}`}>
                    {session.active ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="mb-2">
                  <strong>Attendance:</strong> {attendanceRecords.length} students
                </p>

                {session.active && (
                  <button onClick={handleDeactivateSession} className="btn btn-danger mt-3 w-100">
                    End Session
                  </button>
                )}
              </div>
            </div>

            {session.active && (
              <div className="card mt-4">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">QR Code</h4>
                </div>
                <div className="card-body text-center">
                  <QRCodeSVG
                    value={getQRUrl()}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                    includeMargin={false}
                  />
                  <p className="mt-3 mb-0">
                    <small>{getQRUrl()}</small>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="col-md-8">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Attendance Records</h4>
              </div>
              <div className="card-body">
                {attendanceRecords.length === 0 ? (
                  <p className="text-center my-4">No attendance records yet</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((record) => (
                          <tr key={record._id}>
                            <td>{record.student.name}</td>
                            <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                            <td>
                              <span
                                className={`badge bg-${
                                  record.status === "PRESENT"
                                    ? "success"
                                    : record.status === "LATE"
                                      ? "warning"
                                      : "danger"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default SessionDetails
