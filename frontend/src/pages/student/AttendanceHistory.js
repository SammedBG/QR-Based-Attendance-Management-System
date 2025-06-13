"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    courseId: "",
    status: "",
  })
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch courses
        const coursesRes = await axios.get("/api/courses")
        setCourses(coursesRes.data)

        // Fetch attendance records
        const attendanceRes = await axios.get("/api/attendance")
        setAttendanceRecords(attendanceRes.data)
      } catch (err) {
        setError("Failed to fetch attendance records")
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

  const filteredRecords = attendanceRecords.filter((record) => {
    // Filter by course
    if (filter.courseId && record.session.course._id !== filter.courseId) {
      return false
    }

    // Filter by status
    if (filter.status && record.status !== filter.status) {
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
          <h1>Attendance History</h1>
          <Link to="/student" className="btn btn-outline-primary">
            Back to Dashboard
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
              <div className="col-md-6 mb-3">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  className="form-select"
                  id="status"
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Attendance Records</h5>
            {filteredRecords.length === 0 ? (
              <p className="text-center my-4">No attendance records found</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record._id}>
                        <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                        <td>
                          {record.session.course.name} ({record.session.course.code})
                        </td>
                        <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                        <td>
                          <span
                            className={`badge bg-${
                              record.status === "PRESENT" ? "success" : record.status === "LATE" ? "warning" : "danger"
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
    </>
  )
}

export default AttendanceHistory
