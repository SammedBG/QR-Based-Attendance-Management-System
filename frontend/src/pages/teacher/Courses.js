"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    section: "",
    semester: "",
  })
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/courses")
      setCourses(res.data)
    } catch (err) {
      setError("Failed to fetch courses")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    try {
      const res = await axios.post("/api/courses", formData)
      setCourses([...courses, res.data])
      setFormSuccess("Course created successfully")
      setFormData({
        name: "",
        code: "",
        section: "",
        semester: "",
      })
      setShowAddForm(false)
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create course")
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

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>My Courses</h1>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add New Course"}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {formSuccess && (
          <div className="alert alert-success" role="alert">
            {formSuccess}
          </div>
        )}

        {/* Add Course Form */}
        {showAddForm && (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Add New Course</h4>
            </div>
            <div className="card-body">
              {formError && (
                <div className="alert alert-danger" role="alert">
                  {formError}
                </div>
              )}
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Course Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">
                    Course Code
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="section" className="form-label">
                    Section (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={onChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="semester" className="form-label">
                    Semester
                  </label>
                  <select
                    className="form-select"
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={onChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  Create Course
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Courses List */}
        {courses.length === 0 ? (
          <div className="alert alert-info" role="alert">
            You haven't created any courses yet.
          </div>
        ) : (
          <div className="row">
            {courses.map((course) => (
              <div key={course._id} className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="mb-0">{course.name}</h5>
                  </div>
                  <div className="card-body">
                    <p className="mb-1">
                      <strong>Code:</strong> {course.code}
                    </p>
                    {course.section && (
                      <p className="mb-1">
                        <strong>Section:</strong> {course.section}
                      </p>
                    )}
                    <p className="mb-1">
                      <strong>Semester:</strong> {course.semester}
                    </p>
                    <p className="mb-1">
                      <strong>Students:</strong> {course.students?.length || 0}
                    </p>
                  </div>
                  <div className="card-footer">
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => {
                        // Navigate to generate QR with this course pre-selected
                        // This would be implemented with React Router in a real app
                        alert("Generate QR for " + course.name)
                      }}
                    >
                      Generate QR
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        // View course details
                        // This would be implemented with React Router in a real app
                        alert("View details for " + course.name)
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Courses
