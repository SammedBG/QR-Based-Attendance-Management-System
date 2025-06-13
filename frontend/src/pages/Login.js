"use client"

import { useState, useContext, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import AuthContext from "../context/AuthContext"
import Navbar from "../components/layout/Navbar"

const Login = () => {
  const { login, isAuthenticated, error, clearError, user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const { email, password } = formData

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
    setLoading(true)

    try {
      await login(email, password)

      // Redirect will happen in useEffect
    } catch (err) {
      setAlert({ type: "danger", message: err.response?.data?.error || "Login failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Login</h4>
              </div>
              <div className="card-body">
                {alert && (
                  <div className={`alert alert-${alert.type}`} role="alert">
                    {alert.message}
                  </div>
                )}
                <form onSubmit={onSubmit}>
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
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <p>
                    Don't have an account? <Link to="/register">Register</Link>
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

export default Login
