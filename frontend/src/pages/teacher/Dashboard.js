"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import AuthContext from "../../context/AuthContext"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const Dashboard = () => {
  const { user } = useContext(AuthContext)
  const [summary, setSummary] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("thisWeek")
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch summary data
        const summaryRes = await axios.get("/api/analytics/summary")
        setSummary(summaryRes.data)

        // Fetch attendance chart data
        const attendanceRes = await axios.get(`/api/analytics/attendance?period=${period}`)
        setAttendanceData(attendanceRes.data)

        // Fetch recent attendance
        const recentRes = await axios.get("/api/attendance?limit=5")
        setRecentAttendance(recentRes.data)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to fetch dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [period])

  // Default data if no data is available
  const defaultChartData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Attendance %",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  }

  const chartData = {
    labels: attendanceData.length > 0 ? attendanceData.map((item) => item.name) : defaultChartData.labels,
    datasets: [
      {
        label: "Attendance %",
        data:
          attendanceData.length > 0 ? attendanceData.map((item) => item.attendance) : defaultChartData.datasets[0].data,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Attendance Percentage",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Teacher Dashboard</h1>
          <Link to="/teacher/generate" className="btn btn-primary">
            Generate New QR Code
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Total Students</h5>
                <p className="card-text display-4">{summary?.totalStudents || 0}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Today's Attendance</h5>
                <p className="card-text display-4">{summary?.todayAttendancePercentage || 0}%</p>
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
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <h5 className="card-title">Total Courses</h5>
                <p className="card-text display-4">{summary?.totalCourses || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Attendance Chart */}
          <div className="col-md-8 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Attendance Overview</h5>
                <select
                  className="form-select form-select-sm w-auto"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>
              <div className="card-body">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="col-md-4 mb-4">
            <div className="card">
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
                            <h6 className="mb-0">{record.student.name}</h6>
                            <small className="text-muted">
                              {record.session.course.code} | {new Date(record.timestamp).toLocaleTimeString()}
                            </small>
                          </div>
                          <span
                            className={`badge bg-${record.status === "PRESENT" ? "success" : record.status === "LATE" ? "warning" : "danger"}`}
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
        </div>

        {/* Quick Links */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Generate QR Code</h5>
                <p className="card-text">Create a new QR code for attendance tracking</p>
                <Link to="/teacher/generate" className="btn btn-primary">
                  Go to QR Generator
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Manage Courses</h5>
                <p className="card-text">View and manage your courses</p>
                <Link to="/teacher/courses" className="btn btn-primary">
                  View Courses
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Active Sessions</h5>
                <p className="card-text">View and manage active attendance sessions</p>
                <Link to="/teacher/sessions" className="btn btn-primary">
                  View Sessions
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Attendance Reports</h5>
                <p className="card-text">View detailed attendance reports and analytics</p>
                <Link to="/teacher/reports" className="btn btn-primary">
                  View Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
