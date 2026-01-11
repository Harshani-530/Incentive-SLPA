import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AddEmployeePage from './pages/AddEmployeePage'
import LoginPage from './pages/LoginPage'
import HistoryPage from './pages/HistoryPage'
import SuperAdminPage from './pages/SuperAdminPage'
import OperatorManagementPage from './pages/OperatorManagementPage'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  
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
