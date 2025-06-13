"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Navbar from "../../components/layout/Navbar"
import Spinner from "../../components/layout/Spinner"

const EnrollCourses = () => {
  const [availableCourses, setAvailableCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enrollingCourse, setEnrollingCourse] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    const fetchAvailableCourses = async () => {
      setLoading(true)
      try {
        const res = await axios.get("/api/courses/available/all")
        setAvailableCourses(res.data)
      } catch (err) {
        setError("Failed to fetch available courses")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableCourses()
  }, [])

  const handleEnroll = async (courseId) => {
    setEnrollingCourse(courseId)
    setError(null)
    setSuccessMessage(null)

    try {
      await axios.post(`/api/courses/${courseId}/enroll`)

      // Remove the enrolled course from the list
      setAvailableCourses(availableCourses.filter((course) => course._id !== courseId))
      setSuccessMessage("Successfully enrolled in the course!")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to enroll in course")
      console.error(err)
    } finally {
      setEnrollingCourse(null)
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
          <h1>Enroll in Courses</h1>
          <Link to="/student" className="btn btn-outline-primary">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        {availableCourses.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No available courses to enroll in at the moment.
          </div>
        ) : (
          <div className="row">
            {availableCourses.map((course) => (
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
                      <strong>Teacher:</strong> {course.teacher?.user?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="card-footer">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => handleEnroll(course._id)}
                      disabled={enrollingCourse === course._id}
                    >
                      {enrollingCourse === course._id ? "Enrolling..." : "Enroll"}
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

export default EnrollCourses
