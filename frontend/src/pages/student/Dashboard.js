"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import AuthContext from "../../context/AuthContext"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend)

const StudentDashboard = () => {
  const { user } = useContext(AuthContext)
  const [summary, setSummary] = useState(null)
  const [recentAttendance, setRecentAttendance] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch summary data
        const summaryRes = await axios.get("/api/analytics/summary")
        setSummary(summaryRes.data)

        // Fetch recent attendance
        const recentRes = await axios.get("/api/attendance?limit=5")
        setRecentAttendance(recentRes.data)

        // Fetch courses
        const coursesRes = await axios.get("/api/courses")
        setCourses(coursesRes.data)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const chartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [summary?.attendedSessions || 0, (summary?.totalSessions || 0) - (summary?.attendedSessions || 0)],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Attendance Overview",
      },
    },
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
        <h1 className="mb-4">Student Dashboard</h1>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Total Courses</h5>
                <p className="card-text display-4">{summary?.totalCourses || 0}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Attendance Rate</h5>
                <p className="card-text display-4">{summary?.attendancePercentage || 0}%</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Classes Attended</h5>
                <p className="card-text display-4">{summary?.attendedSessions || 0}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Active Sessions</h5>
                <p className="card-text display-4">{summary?.activeSessions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Attendance Chart */}
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Attendance Overview</h5>
              </div>
              <div className="card-body d-flex align-items-center justify-content-center">
                {summary?.totalSessions > 0 ? (
                  <div style={{ maxHeight: "250px" }}>
                    <Doughnut data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <p className="text-center">No attendance data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Recent Attendance</h5>
              </div>
              <div className="card-body">
                {recentAttendance.length === 0 ? (
                  <p className="text-center">No recent attendance records</p>
                ) : (
                  <ul className="list-group">
                    {recentAttendance.map((record) => (
                      <li key={record._id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-0">{record.session.course.name}</h6>
                            <small className="text-muted">
                              {new Date(record.timestamp).toLocaleDateString()}{" "}
                              {new Date(record.timestamp).toLocaleTimeString()}
                            </small>
                          </div>
                          <span
                            className={`badge bg-${
                              record.status === "PRESENT" ? "success" : record.status === "LATE" ? "warning" : "danger"
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">My Courses</h5>
                <Link to="/student/enroll" className="btn btn-sm btn-outline-primary">
                  Enroll in Courses
                </Link>
              </div>
              <div className="card-body">
                {courses.length === 0 ? (
                  <p className="text-center">No courses enrolled</p>
                ) : (
                  <ul className="list-group">
                    {courses.map((course) => (
                      <li key={course._id} className="list-group-item">
                        <h6 className="mb-0">{course.name}</h6>
                        <small className="text-muted">
                          {course.code} | Semester {course.semester}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Scan QR Code</h5>
                <p className="card-text">Scan a QR code to mark your attendance</p>
                <Link to="/student/scan" className="btn btn-primary">
                  Scan QR Code
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Attendance History</h5>
                <p className="card-text">View your complete attendance history</p>
                <Link to="/student/history" className="btn btn-primary">
                  View History
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Enroll in Courses</h5>
                <p className="card-text">Browse and enroll in available courses</p>
                <Link to="/student/enroll" className="btn btn-primary">
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Security Settings</h5>
                <p className="card-text">Configure your attendance security preferences</p>
                <Link to="/student/security" className="btn btn-primary">
                  Security Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StudentDashboard
