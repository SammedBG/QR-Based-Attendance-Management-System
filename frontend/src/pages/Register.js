"use client"

import { useState, useContext, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import AuthContext from "../context/AuthContext"
import Navbar from "../components/layout/Navbar"

const Register = () => {
  const { register, isAuthenticated, error, clearError, user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    userType: "STUDENT",
    usn: "",
    regNo: "",
    department: "",
    semester: "",
    employeeId: "",
  })

  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const { name, email, password, password2, userType, usn, regNo, department, semester, employeeId } = formData

  useEffect(() => {
    // If already authenticated, redirect
    if (isAuthenticated) {
      if (user.userType === "TEACHER") {
        navigate("/teacher")
      } else {
        navigate("/student")
      }
    }

    // Show error if exists
    if (error) {
      setAlert({ type: "danger", message: error })
      clearError()
    }
  }, [isAuthenticated, error, user, navigate, clearError])

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    if (password !== password2) {
      setAlert({ type: "danger", message: "Passwords do not match" })
      return
    }

    setLoading(true)

    try {
      const registerData = {
        name,
        email,
        password,
        userType,
        ...(userType === "STUDENT" && { usn, regNo, department, semester }),
        ...(userType === "TEACHER" && { employeeId, department }),
      }

      await register(registerData)

      // Redirect will happen in useEffect
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Registration failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Register</h4>
              </div>
              <div className="card-body">
                {alert && (
                  <div className={`alert alert-${alert.type}`} role="alert">
                    {alert.message}
                  </div>
                )}
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={name}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={password}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password2" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password2"
                      name="password2"
                      value={password2}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">User Type</label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="userType"
                        id="student"
                        value="STUDENT"
                        checked={userType === "STUDENT"}
                        onChange={onChange}
                      />
                      <label className="form-check-label" htmlFor="student">
                        Student
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="userType"
                        id="teacher"
                        value="TEACHER"
                        checked={userType === "TEACHER"}
                        onChange={onChange}
                      />
                      <label className="form-check-label" htmlFor="teacher">
                        Teacher
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="department" className="form-label">
                      Department
                    </label>
                    <select
                      className="form-select"
                      id="department"
                      name="department"
                      value={department}
                      onChange={onChange}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>

                  {userType === "STUDENT" && (
                    <>
                      <div className="mb-3">
                        <label htmlFor="usn" className="form-label">
                          USN
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="usn"
                          name="usn"
                          value={usn}
                          onChange={onChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="regNo" className="form-label">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="regNo"
                          name="regNo"
                          value={regNo}
                          onChange={onChange}
                          required
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
                          value={semester}
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
                    </>
                  )}

                  {userType === "TEACHER" && (
                    <div className="mb-3">
                      <label htmlFor="employeeId" className="form-label">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="employeeId"
                        name="employeeId"
                        value={employeeId}
                        onChange={onChange}
                        required
                      />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <p>
                    Already have an account? <Link to="/login">Login</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
