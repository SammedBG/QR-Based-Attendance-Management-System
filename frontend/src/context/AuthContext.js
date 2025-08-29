"use client"

import { createContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.token) {
        setAuthToken(localStorage.token)
        try {
          const res = await axios.get("/api/auth/me")
          setUser(res.data.user)
          setProfile(res.data.profile)
          setIsAuthenticated(true)
        } catch (err) {
          localStorage.removeItem("token")
          setUser(null)
          setProfile(null)
          setIsAuthenticated(false)
          setError(err.response?.data?.error || "Authentication failed")
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      localStorage.setItem("token", token)
    } else {
      delete axios.defaults.headers.common["Authorization"]
      localStorage.removeItem("token")
    }
  }

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post("/api/auth/register", formData)

      setAuthToken(res.data.token)
      await loadUser()

      return res.data
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed")
      throw err
    }
  }

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password })

      setAuthToken(res.data.token)
      setUser(res.data)
      setIsAuthenticated(true)
      setLoading(false)

      // Load full user profile
      await loadUser()

      return res.data
    } catch (err) {
      setError(err.response?.data?.error || "Login failed")
      throw err
    }
  }

  // Load user data
  const loadUser = async () => {
    try {
      const res = await axios.get("/api/auth/me")
      setUser(res.data.user)
      setProfile(res.data.profile)
      setIsAuthenticated(true)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load user")
      throw err
    }
  }

  // Logout user
  const logout = () => {
    setAuthToken(null)
    setUser(null)
    setProfile(null)
    setIsAuthenticated(false)
  }

  // Clear errors
  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        loadUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
