"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { format, parseISO } from "date-fns"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const AttendanceReport = () => {
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
  const [studentAttendance, setStudentAttendance] = useState([])
  const [activeTab, setActiveTab] = useState("course")

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/courses")
        setCourses(res.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch courses")
        console.error(err)
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceData()
    }
  }, [selectedCourse, startDate, endDate])

  const fetchAttendanceData = async () => {
    setLoading(true)
    setError(null) // Clear previous errors
    try {
      // Fetch course attendance summary
      const courseRes = await axios.get("/api/analytics/course-attendance")
      setCourseAttendance(courseRes.data)

      // Fetch daily attendance for selected course
      const dailyRes = await axios.get(
        `/api/analytics/daily-attendance?courseId=${selectedCourse}&startDate=${startDate}&endDate=${endDate}`,
      )
      setDailyAttendance(dailyRes.data)

      // Fetch student attendance for selected course
      const studentRes = await axios.get(
        `/api/analytics/student-attendance?courseId=${selectedCourse}&startDate=${startDate}&endDate=${endDate}`,
      )
      setStudentAttendance(studentRes.data)
    } catch (err) {
      console.error("Failed to fetch attendance data:", err)
      setError(err.response?.data?.error || "Failed to fetch attendance data. Please try again.")
    } finally {
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

  // Prepare chart data for daily attendance
  const dailyChartData = {
    labels: dailyAttendance.map((day) => format(parseISO(day.date), "MMM dd")),
    datasets: [
      {
        label: "Attendance %",
        data: dailyAttendance.map((day) => day.attendancePercentage),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
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
        text: "Daily Attendance Percentage",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  // Prepare chart data for course comparison
  const courseChartData = {
    labels: courseAttendance.map((course) => course.code),
    datasets: [
      {
        label: "Attendance %",
        data: courseAttendance.map((course) => course.attendancePercentage),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
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
          <h1>Attendance Reports</h1>
          <Link to="/teacher" className="btn btn-outline-primary">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label htmlFor="courseSelect" className="form-label">
                  Select Course
                </label>
                <select id="courseSelect" className="form-select" value={selectedCourse} onChange={handleCourseChange}>
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
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
              <div className="col-md-4 mb-3">
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
          </div>
        </div>

        {!selectedCourse ? (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Course Attendance Overview</h5>
              {courseAttendance.length > 0 ? (
                <div style={{ height: "400px" }}>
                  <Bar data={courseChartData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-center">Please select a course to view attendance data</p>
              )}
            </div>
          </div>
        ) : loading ? (
          <Spinner />
        ) : (
          <>
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "course" ? "active" : ""}`}
                  onClick={() => setActiveTab("course")}
                >
                  Course Summary
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
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "student" ? "active" : ""}`}
                  onClick={() => setActiveTab("student")}
                >
                  Student Attendance
                </button>
              </li>
            </ul>

            {activeTab === "course" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Course Attendance Summary</h5>
                </div>
                <div className="card-body">
                  {courseAttendance
                    .filter((course) => course._id === selectedCourse)
                    .map((course) => (
                      <div key={course._id}>
                        <h4>
                          {course.name} ({course.code})
                        </h4>
                        <div className="row mt-4">
                          <div className="col-md-4">
                            <div className="card text-center">
                              <div className="card-body">
                                <h5 className="card-title">Total Sessions</h5>
                                <p className="card-text display-4">{course.totalSessions}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card text-center">
                              <div className="card-body">
                                <h5 className="card-title">Total Students</h5>
                                <p className="card-text display-4">{course.totalStudents}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card text-center">
                              <div className="card-body">
                                <h5 className="card-title">Attendance Rate</h5>
                                <p className="card-text display-4">{course.attendancePercentage}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "daily" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Daily Attendance</h5>
                </div>
                <div className="card-body">
                  {dailyAttendance.length > 0 ? (
                    <>
                      <div style={{ height: "400px" }} className="mb-4">
                        <Bar data={dailyChartData} options={chartOptions} />
                      </div>
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Present</th>
                              <th>Total</th>
                              <th>Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyAttendance.map((day) => (
                              <tr key={day.sessionId}>
                                <td>{format(parseISO(day.date), "EEEE, MMMM d, yyyy")}</td>
                                <td>{day.attendanceCount}</td>
                                <td>{day.totalStudents}</td>
                                <td>
                                  <div className="progress">
                                    <div
                                      className={`progress-bar ${
                                        day.attendancePercentage < 50
                                          ? "bg-danger"
                                          : day.attendancePercentage < 75
                                            ? "bg-warning"
                                            : "bg-success"
                                      }`}
                                      role="progressbar"
                                      style={{ width: `${day.attendancePercentage}%` }}
                                      aria-valuenow={day.attendancePercentage}
                                      aria-valuemin="0"
                                      aria-valuemax="100"
                                    >
                                      {day.attendancePercentage}%
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-center">No attendance data available for the selected date range</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "student" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Student Attendance</h5>
                </div>
                <div className="card-body">
                  {studentAttendance.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Present</th>
                            <th>Total</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentAttendance.map((student) => (
                            <tr key={student.studentId}>
                              <td>{student.studentName}</td>
                              <td>{student.email}</td>
                              <td>{student.attendedSessions}</td>
                              <td>{student.totalSessions}</td>
                              <td>
                                <div className="progress">
                                  <div
                                    className={`progress-bar ${
                                      student.attendancePercentage < 50
                                        ? "bg-danger"
                                        : student.attendancePercentage < 75
                                          ? "bg-warning"
                                          : "bg-success"
                                    }`}
                                    role="progressbar"
                                    style={{ width: `${student.attendancePercentage}%` }}
                                    aria-valuenow={student.attendancePercentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {student.attendancePercentage}%
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center">No student attendance data available for the selected date range</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default AttendanceReport
