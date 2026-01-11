import { useNavigate } from 'react-router-dom'
import './OperatorManagementPage.css'
import logoImage from '../assets/logo.png'
import { useState, useEffect } from 'react'
import { operatorsAPI } from '../services/api'
import ChangePasswordModal from '../components/ChangePasswordModal'
import Footer from '../components/Footer'
import { validateUsername } from '../utils/usernameValidator'

interface Operator {
  id: number;
  username: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function OperatorManagementPage() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  
  // Get logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // Check if user is Admin or Super Admin
  useEffect(() => {
    if (user.role !== 'Admin' && user.role !== 'Super Admin') {
      navigate('/')
    }
  }, [user.role, navigate])
  
  // Create Operator form
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Operators list
  const [operators, setOperators] = useState<Operator[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [usernameError, setUsernameError] = useState('')

  // Load operators on mount
  useEffect(() => {
    loadOperators()
  }, [])

  const loadOperators = async () => {
    try {
      setLoading(true)
      const data = await operatorsAPI.getAll()
      setOperators(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create Operator user
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setUsernameError('')

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Username and password are required')
      return
    }

    // Validate username
    const usernameValidation = validateUsername(newUsername.trim(), newPassword)
    if (!usernameValidation.valid) {
      setError(usernameValidation.error || 'Invalid username')
      return
    }

    if (newName.trim() && newName.trim().length > 30) {
      setError('Name cannot exceed 30 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      await operatorsAPI.create({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim() || undefined
      })
      setSuccess('Operator user created successfully!')
      setNewUsername('')
      setNewName('')
      setNewPassword('')
      setConfirmPassword('')
      await loadOperators()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle operator active status
  const handleToggleActive = async (operatorId: number, username: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} operator "${username}"?`)) {
      return
    }

    try {
      setLoading(true)
      await operatorsAPI.toggleActive(operatorId)
      setSuccess(`Operator "${username}" has been ${isActive ? 'deactivated' : 'activated'}`)
      await loadOperators()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset operator password
  const handleResetPassword = async (operatorId: number, username: string) => {
    const newPass = prompt(`Enter new password for operator "${username}":`)
    if (!newPass) return

    if (newPass.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      await operatorsAPI.resetPassword(operatorId, newPass)
      setSuccess(`Password reset successfully for operator "${username}"`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete operator
  const handleDeleteOperator = async (operatorId: number, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete operator "${username}"?\n\nThis action cannot be undone!`)) {
      return
    }

    try {
      setLoading(true)
      await operatorsAPI.deleteOperator(operatorId)
      setSuccess(`Operator "${username}" has been deleted successfully`)
      await loadOperators()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <div className="logo">
            <img src={logoImage} alt="SLPA Logo" className="logo-image" />
          </div>
        </div>
        <h1 className="app-title">Incentive Calculation System</h1>
        <div className="user-menu">
          <button 
            className="user-icon" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 17.134 18 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <strong>{user.username || 'User'}</strong>
                <span className="user-role">{user.role || ''}</span>
              </div>
              <button className="dropdown-item" onClick={() => navigate('/')}>
                &#127968; Home
              </button>
              <button className="dropdown-item" onClick={() => {
                setShowDropdown(false)
                setShowChangePassword(true)
              }}>
                &#128274; Change Password
              </button>
              <button className="dropdown-item" onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                navigate('/login')
              }}>
                &#128682; Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <div className="page-header">
          <h2>Operator Management</h2>
          <button className="add-employee-btn" onClick={() => navigate('/')}>
            &#8592; Back to Home
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Create Operator Section */}
        <div className="form-section">
          <h3>Create Operator User</h3>
          <form onSubmit={handleCreateOperator}>
            <div className="form-row">
              <div className="form-group">
                <label>Username: (2-6 chars, start with lowercase letter)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase()
                    setNewUsername(value)
                    // Real-time validation
                    if (value.trim()) {
                      const validation = validateUsername(value.trim(), newPassword)
                      setUsernameError(validation.error || '')
                    } else {
                      setUsernameError('')
                    }
                  }}
                  placeholder="e.g. john, user1, j_doe"
                  className={`form-input ${usernameError ? 'input-error' : ''}`}
                  maxLength={6}
                />
                {usernameError && <small className="field-error">{usernameError}</small>}
                <small className="field-hint">
                  Only lowercase letters, numbers, dot (.), underscore (_). Cannot end with . or _. No consecutive dots/underscores.
                </small>
              </div>
              <div className="form-group">
                <label>Name: (max 30 characters, optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter full name"
                  className="form-input"
                  maxLength={30}
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="form-input"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Operator'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Operators Management Table */}
        <div className="table-section">
          <h3>Manage Operators</h3>
          {operators.length === 0 ? (
            <p className="no-data">No operators found</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.id}>
                    <td>{op.username}</td>
                    <td>{op.name || '-'}</td>
                    <td>
                      <span className="role-badge operator">
                        {op.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${op.isActive ? 'active' : 'inactive'}`}>
                        {op.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(op.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-small btn-warning"
                          onClick={() => handleToggleActive(op.id, op.username, op.isActive)}
                          title={op.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {op.isActive ? '🚫' : '✓'}
                        </button>
                        <button 
                          className="btn-small btn-info"
                          onClick={() => handleResetPassword(op.id, op.username)}
                          title="Reset Password"
                        >
                          🔑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Footer />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => alert('Password changed successfully!')}
      />
    </div>
  )
}

export default OperatorManagementPage
