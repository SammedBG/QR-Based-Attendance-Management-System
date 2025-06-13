"use client"

import { useContext } from "react"
import { Link } from "react-router-dom"
import AuthContext from "../context/AuthContext"
import Navbar from "../components/layout/Navbar"

const Home = () => {
  const { isAuthenticated, user } = useContext(AuthContext)

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="jumbotron text-center">
          <h1 className="display-4">QR Attendance System</h1>
          <p className="lead">A simple QR code-based attendance system for educational institutions</p>
          <hr className="my-4" />

          {isAuthenticated ? (
            <div>
              <p>Welcome, {user.name}!</p>
              <div className="d-grid gap-2 col-6 mx-auto">
                {user.userType === "TEACHER" ? (
                  <Link to="/teacher" className="btn btn-primary btn-lg">
                    Go to Teacher Dashboard
                  </Link>
                ) : (
                  <Link to="/student" className="btn btn-primary btn-lg">
                    Go to Student Dashboard
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="d-grid gap-2 col-6 mx-auto">
              <Link to="/login" className="btn btn-primary btn-lg">
                Login
              </Link>
              <Link to="/register" className="btn btn-outline-primary btn-lg">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Home
