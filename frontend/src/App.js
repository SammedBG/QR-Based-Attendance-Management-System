import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import PrivateRoute from "./components/routing/PrivateRoute"
import TeacherRoute from "./components/routing/TeacherRoute"
import StudentRoute from "./components/routing/StudentRoute"

// Public pages
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./pages/NotFound"

// Teacher pages
import TeacherDashboard from "./pages/teacher/Dashboard"
import GenerateQR from "./pages/teacher/GenerateQR"
import Courses from "./pages/teacher/Courses"
import Sessions from "./pages/teacher/Sessions"
import SessionDetails from "./pages/teacher/SessionDetails"

// Student pages
import StudentDashboard from "./pages/student/Dashboard"
import ScanQR from "./pages/student/ScanQR"
import AttendanceHistory from "./pages/student/AttendanceHistory"
import AttendancePage from "./pages/student/AttendancePage"
import EnrollCourses from "./pages/student/EnrollCourses"
import SecuritySettings from "./pages/student/SecuritySettings"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <TeacherRoute>
                <TeacherDashboard />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/generate"
            element={
              <TeacherRoute>
                <GenerateQR />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/courses"
            element={
              <TeacherRoute>
                <Courses />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/sessions"
            element={
              <TeacherRoute>
                <Sessions />
              </TeacherRoute>
            }
          />
          <Route
            path="/teacher/sessions/:id"
            element={
              <TeacherRoute>
                <SessionDetails />
              </TeacherRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            }
          />
          <Route
            path="/student/scan"
            element={
              <StudentRoute>
                <ScanQR />
              </StudentRoute>
            }
          />
          <Route
            path="/student/history"
            element={
              <StudentRoute>
                <AttendanceHistory />
              </StudentRoute>
            }
          />
          <Route
            path="/student/enroll"
            element={
              <StudentRoute>
                <EnrollCourses />
              </StudentRoute>
            }
          />
          <Route
            path="/student/security"
            element={
              <StudentRoute>
                <SecuritySettings />
              </StudentRoute>
            }
          />
          <Route
            path="/attendance/:qrCode"
            element={
              <PrivateRoute>
                <AttendancePage />
              </PrivateRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
