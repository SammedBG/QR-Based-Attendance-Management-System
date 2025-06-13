"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { format, parseISO } from "date-fns"
import { Bar, Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import AuthContext from "../../context/AuthContext"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const StudentAttendanceReport = () => {
  const { user } = useContext(AuthContext)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
  )
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [courseAttendance, setCourseAttendance] = useState([])
  const [dailyAttendance, setDailyAttendance] = useState([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesRes = await axios.get("/api/courses")
        setCourses(coursesRes.data)

        // Fetch course attendance summary
        const courseRes = await axios.get("/api/analytics/course-attendance")
        setCourseAttendance(courseRes.data)

        setLoading(false)
      } catch (err) {
        setError("Failed to fetch data")
        console.error(err)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchDailyAttendance()
    }
  }, [selectedCourse, startDate, endDate])

  const fetchDailyAttendance = async () => {
    setLoading(true)
    try {
      const res = await axios.get(
        `/api/analytics/daily-attendance?courseId=${selectedCourse}&studentId=${user._id}&startDate=${startDate}&endDate=${endDate}`,
      )
      setDailyAttendance(res.data)
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch daily attendance")
      console.error(err)
      setLoading(false)
    }
  }

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value)
  }

  const handleDateChange = (e) => {
    if (e.target.name === "startDate") {
      setStartDate(e.target.value)
    } else if (e.target.name === "endDate") {
      setEndDate(e.target.value)
    }
  }

  // Prepare chart data for course comparison
  const courseChartData = {
    labels: courseAttendance.map((course) => course.code),
    datasets: [
      {
        label: "Attendance %",
        data: courseAttendance.map((course) => course.attendancePercentage),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Prepare chart data for daily attendance
  const dailyChartData = {
    labels: dailyAttendance.map((day) => format(parseISO(day.date), "MMM dd")),
    datasets: [
      {
        label: "Attendance",
        data: dailyAttendance.map((day) => (day.present ? 1 : 0)),
        backgroundColor: dailyAttendance.map((day) =>
          day.present ? "rgba(75, 192, 192, 0.6)" : "rgba(255, 99, 132, 0.6)",
        ),
        borderColor: dailyAttendance.map((day) => (day.present ? "rgba(75, 192, 192, 1)" : "rgba(255, 99, 132, 1)")),
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
        text: "Course Attendance Percentage",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Course Attendance Percentage",
      },
    },
  }

  // Calculate overall attendance
  const calculateOverallAttendance = () => {
    if (courseAttendance.length === 0) return 0

    const totalSessions = courseAttendance.reduce((sum, course) => sum + course.totalSessions, 0)
    const attendedSessions = courseAttendance.reduce((sum, course) => sum + course.attendedSessions, 0)

    return totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0
  }

  const overallAttendance = calculateOverallAttendance()

  // Prepare data for overall attendance doughnut chart
  const overallChartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [overallAttendance, 100 - overallAttendance],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  }

  if (loading && courses.length === 0) {
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
          <h1>My Attendance Report</h1>
          <Link to="/student" className="btn btn-outline-primary">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "courses" ? "active" : ""}`}
              onClick={() => setActiveTab("courses")}
            >
              Courses
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "daily" ? "active" : ""}`}
              onClick={() => setActiveTab("daily")}
            >
              Daily Attendance
            </button>
          </li>
        </ul>

        {activeTab === "overview" && (
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Overall Attendance</h5>
                </div>
                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                  <div style={{ maxWidth: "300px" }}>
                    <Doughnut data={overallChartData} options={doughnutOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <h2 className="mb-0">{overallAttendance}%</h2>
                    <p className="text-muted">Overall Attendance Rate</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Attendance by Course</h5>
                </div>
                <div className="card-body">
                  {courseAttendance.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Present</th>
                            <th>Total</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseAttendance.map((course) => (
                            <tr key={course._id}>
                              <td>{course.code}</td>
                              <td>{course.attendedSessions}</td>
                              <td>{course.totalSessions}</td>
                              <td>
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${
                                      course.attendancePercentage < 50
                                        ? "bg-danger"
                                        : course.attendancePercentage < 75
                                          ? "bg-warning"
                                          : "bg-success"
                                    }`}
                                    role="progressbar"
                                    style={{ width: `${course.attendancePercentage}%` }}
                                    aria-valuenow={course.attendancePercentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {course.attendancePercentage}%
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center">No attendance data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Course Attendance</h5>
            </div>
            <div className="card-body">
              {courseAttendance.length > 0 ? (
                <>
                  <div style={{ height: "400px" }} className="mb-4">
                    <Bar data={courseChartData} options={chartOptions} />
                  </div>
                  <div className="row">
                    {courseAttendance.map((course) => (
                      <div key={course._id} className="col-md-4 mb-4">
                        <div className="card">
                          <div className="card-body text-center">
                            <h5 className="card-title">{course.name}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">{course.code}</h6>
                            <div className="mt-3">
                              <div
                                className="progress-circle"
                                style={{
                                  width: "120px",
                                  height: "120px",
                                  borderRadius: "50%",
                                  background: `conic-gradient(
                                    ${
                                      course.attendancePercentage < 50
                                        ? "#dc3545"
                                        : course.attendancePercentage < 75
                                          ? "#ffc107"
                                          : "#28a745"
                                    } ${course.attendancePercentage * 3.6}deg,
                                    #e9ecef ${course.attendancePercentage * 3.6}deg 360deg
                                  )`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  margin: "0 auto",
                                }}
                              >
                                <div
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    borderRadius: "50%",
                                    backgroundColor: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                    {course.attendancePercentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="mb-1">
                                <strong>Present:</strong> {course.attendedSessions} / {course.totalSessions}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center">No course attendance data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "daily" && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Daily Attendance</h5>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <label htmlFor="courseSelect" className="form-label">
                    Select Course
                  </label>
                  <select
                    id="courseSelect"
                    className="form-select"
                    value={selectedCourse}
                    onChange={handleCourseChange}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    name="startDate"
                    value={startDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    name="endDate"
                    value={endDate}
                    onChange={handleDateChange}
                  />
                </div>
              </div>

              {!selectedCourse ? (
                <p className="text-center">Please select a course to view daily attendance</p>
              ) : loading ? (
                <Spinner />
              ) : dailyAttendance.length > 0 ? (
                <>
                  <div style={{ height: "300px" }} className="mb-4">
                    <Bar
                      data={dailyChartData}
                      options={{ ...chartOptions, scales: { y: { min: 0, max: 1, ticks: { stepSize: 1 } } } }}
                    />
                  </div>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyAttendance.map((day) => (
                          <tr key={day.sessionId}>
                            <td>{format(parseISO(day.date), "EEEE, MMMM d, yyyy")}</td>
                            <td>
                              <span className={`badge ${day.present ? "bg-success" : "bg-danger"}`}>
                                {day.present ? "Present" : "Absent"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center">No attendance data available for the selected course and date range</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default StudentAttendanceReport
