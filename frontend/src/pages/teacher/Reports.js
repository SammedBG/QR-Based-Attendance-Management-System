"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"
import { Link } from "react-router-dom"

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [courses, setCourses] = useState([])
  const [records, setRecords] = useState([])

  const [filters, setFilters] = useState({
    courseId: "",
    from: "",
    to: "",
    status: "",
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Teacher’s courses
        const coursesRes = await axios.get("/api/courses")
        setCourses(coursesRes.data)

        // Initial records (all teacher’s sessions)
        const recRes = await axios.get("/api/attendance")
        setRecords(recRes.data)
      } catch (e) {
        console.error(e)
        setError("Failed to load reports data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      // by course
      if (filters.courseId && r.session.course._id !== filters.courseId) return false
      // by status
      if (filters.status && r.status !== filters.status) return false
      // by date range
      const ts = new Date(r.timestamp).getTime()
      if (filters.from) {
        const fromTs = new Date(filters.from + "T00:00:00").getTime()
        if (ts < fromTs) return false
      }
      if (filters.to) {
        const toTs = new Date(filters.to + "T23:59:59").getTime()
        if (ts > toTs) return false
      }
      return true
    })
  }, [records, filters])

  const presentCount = filtered.filter((r) => r.status === "PRESENT").length
  const lateCount = filtered.filter((r) => r.status === "LATE").length
  const absentCount = filtered.filter((r) => r.status === "ABSENT").length

  const exportCSV = () => {
    const headers = ["Date", "Time", "Course", "Student", "Email", "Status"]
    const rows = filtered.map((r) => [
      new Date(r.timestamp).toLocaleDateString(),
      new Date(r.timestamp).toLocaleTimeString(),
      `${r.session.course.name} (${r.session.course.code})`,
      r.student?.name || "",
      r.student?.email || "",
      r.status,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "attendance-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
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
          <h1>Reports</h1>
          <Link to="/teacher" className="btn btn-outline-primary">
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
              <div className="col-md-3 mb-3">
                <label className="form-label" htmlFor="courseId">
                  Course
                </label>
                <select
                  id="courseId"
                  name="courseId"
                  className="form-select"
                  value={filters.courseId}
                  onChange={onFilterChange}
                >
                  <option value="">All courses</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label" htmlFor="from">
                  From
                </label>
                <input
                  type="date"
                  id="from"
                  name="from"
                  className="form-control"
                  value={filters.from}
                  onChange={onFilterChange}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label" htmlFor="to">
                  To
                </label>
                <input
                  type="date"
                  id="to"
                  name="to"
                  className="form-control"
                  value={filters.to}
                  onChange={onFilterChange}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={filters.status}
                  onChange={onFilterChange}
                >
                  <option value="">All</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={exportCSV} disabled={filtered.length === 0}>
                Export CSV
              </button>
              <span className="align-self-center text-muted">
                Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""} — Present: {presentCount} | Late:{" "}
                {lateCount} | Absent: {absentCount}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Attendance Records</h5>
            {filtered.length === 0 ? (
              <p className="text-center my-4">No records found for the selected filters.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Course</th>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r._id}>
                        <td>{new Date(r.timestamp).toLocaleDateString()}</td>
                        <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
                        <td>
                          {r.session.course.name} ({r.session.course.code})
                        </td>
                        <td>{r.student?.name}</td>
                        <td>{r.student?.email}</td>
                        <td>
                          <span
                            className={`badge bg-${
                              r.status === "PRESENT" ? "success" : r.status === "LATE" ? "warning" : "danger"
                            }`}
                          >
                            {r.status}
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

export default Reports
