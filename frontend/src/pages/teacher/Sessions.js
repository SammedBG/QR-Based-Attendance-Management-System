"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const Sessions = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    active: "",
    courseId: "",
  })
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch courses
        const coursesRes = await axios.get("/api/courses")
        setCourses(coursesRes.data)

        // Fetch sessions
        const sessionsRes = await axios.get("/api/sessions")
        setSessions(sessionsRes.data)
      } catch (err) {
        setError("Failed to fetch sessions")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    })
  }

  const handleDeactivateSession = async (sessionId) => {
    try {
      await axios.patch(`/api/sessions/${sessionId}`, { active: false })

      // Update the sessions list
      setSessions(sessions.map((session) => (session._id === sessionId ? { ...session, active: false } : session)))
    } catch (err) {
      setError("Failed to deactivate session")
      console.error(err)
    }
  }

  const filteredSessions = sessions.filter((session) => {
    // Filter by active status
    if (filter.active === "true" && !session.active) {
      return false
    }
    if (filter.active === "false" && session.active) {
      return false
    }

    // Filter by course
    if (filter.courseId && session.course._id !== filter.courseId) {
      return false
    }

    return true
  })

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
          <h1>Sessions</h1>
          <Link to="/teacher/generate" className="btn btn-primary">
            Generate New QR Code
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Filters</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="active" className="form-label">
                  Status
                </label>
                <select
                  className="form-select"
                  id="active"
                  name="active"
                  value={filter.active}
                  onChange={handleFilterChange}
                >
                  <option value="">All Sessions</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="courseId" className="form-label">
                  Course
                </label>
                <select
                  className="form-select"
                  id="courseId"
                  name="courseId"
                  value={filter.courseId}
                  onChange={handleFilterChange}
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No sessions found matching your filters.
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Sessions</h5>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session._id}>
                        <td>{new Date(session.date).toLocaleDateString()}</td>
                        <td>
                          {session.course.name} ({session.course.code})
                        </td>
                        <td>
                          {new Date(session.startTime).toLocaleTimeString()} -
                          {session.endTime ? new Date(session.endTime).toLocaleTimeString() : "Ongoing"}
                        </td>
                        <td>
                          <span className={`badge bg-${session.active ? "success" : "secondary"}`}>
                            {session.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <Link to={`/teacher/sessions/${session._id}`} className="btn btn-sm btn-outline-primary me-2">
                            View
                          </Link>
                          {session.active && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeactivateSession(session._id)}
                            >
                              End Session
                            </button>
                          )}
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

export default Sessions
