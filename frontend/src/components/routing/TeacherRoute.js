"use client"

import { useContext } from "react"
import { Navigate } from "react-router-dom"
import AuthContext from "../../context/AuthContext"
import Spinner from "../layout/Spinner"

const TeacherRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext)

  if (loading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return user && user.userType === "TEACHER" ? children : <Navigate to="/" />
}

export default TeacherRoute
