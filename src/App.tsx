import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import AddEmployeePage from './pages/AddEmployeePage'
import LoginPage from './pages/LoginPage'
import HistoryPage from './pages/HistoryPage'
import SuperAdminPage from './pages/SuperAdminPage'
import OperatorManagementPage from './pages/OperatorManagementPage'
import { sessionManager } from './utils/sessionManager'

// Protected Route Component with Session Management
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  
  useEffect(() => {
    if (token) {
      // Initialize session manager for authenticated users
      sessionManager.initialize(() => {
        // Handle auto-logout
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.setItem('sessionExpired', 'true')
        navigate('/login', { replace: true })
      })
    }

    return () => {
      sessionManager.destroy()
    }
  }, [token, navigate])
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-employee" 
          element={
            <ProtectedRoute>
              <AddEmployeePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/super-admin" 
          element={
            <ProtectedRoute>
              <SuperAdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/operators" 
          element={
            <ProtectedRoute>
              <OperatorManagementPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
