"use client"

import { useContext } from "react"
import { Link } from "react-router-dom"
import AuthContext from "../../context/AuthContext"

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext)

  const handleLogout = () => {
    logout()
  }

  const teacherLinks = (
    <ul className="navbar-nav">
      <li className="nav-item">
        <Link to="/teacher" className="nav-link">
          Dashboard
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/teacher/generate" className="nav-link">
          Generate QR
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/teacher/courses" className="nav-link">
          Courses
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/teacher/sessions" className="nav-link">
          Sessions
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/teacher/reports" className="nav-link">
          Reports
        </Link>
      </li>
      <li className="nav-item">
        <a href="#!" onClick={handleLogout} className="nav-link">
          Logout
        </a>
      </li>
    </ul>
  )

  const studentLinks = (
    <ul className="navbar-nav">
      <li className="nav-item">
        <Link to="/student" className="nav-link">
          Dashboard
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/student/scan" className="nav-link">
          Scan QR
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/student/history" className="nav-link">
          Attendance History
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/student/enroll" className="nav-link">
          Enroll in Courses
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/student/security" className="nav-link">
          Security Settings
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/student/reports" className="nav-link">
          Reports
        </Link>
      </li>
      <li className="nav-item">
        <a href="#!" onClick={handleLogout} className="nav-link">
          Logout
        </a>
      </li>
    </ul>
  )

  const guestLinks = (
    <ul className="navbar-nav">
      <li className="nav-item">
        <Link to="/register" className="nav-link">
          Register
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/login" className="nav-link">
          Login
        </Link>
      </li>
    </ul>
  )

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link to="/" className="navbar-brand">
          QR Attendance System
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated ? (user.userType === "TEACHER" ? teacherLinks : studentLinks) : guestLinks}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
