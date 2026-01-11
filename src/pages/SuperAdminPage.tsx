import { useNavigate } from 'react-router-dom'
import './SuperAdminPage.css'
import logoImage from '../assets/logo.png'
import { useState, useEffect } from 'react'
import { usersAPI, superAdminAPI } from '../services/api'
import ChangePasswordModal from '../components/ChangePasswordModal'
import Footer from '../components/Footer'
import { validateUsername } from '../utils/usernameValidator'

interface User {
  id: number;
  username: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function SuperAdminPage() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  
  // Get logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // Check if user is Super Admin
  useEffect(() => {
    if (user.role !== 'Super Admin') {
      navigate('/')
    }
  }, [user.role, navigate])
  
  // Create Admin form
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Reprocess form
  const [reprocessMonth, setReprocessMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Users list
  const [users, setUsers] = useState<User[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [usernameError, setUsernameError] = useState('')

  // Load users on mount
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usersAPI.getAll()
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Create Admin user
  const handleCreateAdmin = async (e: React.FormEvent) => {
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
      await usersAPI.createAdmin({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim() || undefined
      })
      setSuccess('Admin user created successfully!')
      setNewUsername('')
      setNewName('')
      setNewPassword('')
      setConfirmPassword('')
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reprocess month
  const handleReprocess = async () => {
    setError('')
    setSuccess('')

    if (!reprocessMonth) {
      setError('Please select a month')
      return
    }

    const confirmMsg = `Are you sure you want to reprocess ${reprocessMonth}?\n\nThis will:\n- Unlock the month for data entry\n- Delete all history records\n- Reset monthly report status\n- Preserve employee days data\n\nThis action cannot be undone!`
    
    if (!confirm(confirmMsg)) {
      return
    }

    try {
      setLoading(true)
      const result = await superAdminAPI.reprocessMonth(reprocessMonth)
      setSuccess(result.message)
      
      // Clear localStorage for this month
      const savedDataKey = `monthData_${reprocessMonth}`
      localStorage.removeItem(savedDataKey)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle user active status
  const handleToggleActive = async (userId: number, username: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} user "${username}"?`)) {
      return
    }

    try {
      setLoading(true)
      await usersAPI.toggleActive(userId)
      setSuccess(`User "${username}" has been ${isActive ? 'deactivated' : 'activated'}`)
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset user password
  const handleResetPassword = async (userId: number, username: string) => {
    const newPass = prompt(`Enter new password for user "${username}":`)
    if (!newPass) return

    if (newPass.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      await usersAPI.resetPassword(userId, newPass)
      setSuccess(`Password reset successfully for user "${username}"`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  // Delete user
  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"?\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      setLoading(true);
      await usersAPI.deleteUser(userId);
      setSuccess(`User "${username}" has been deleted successfully`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <h2>Super Admin Control Panel</h2>
        </div>

        {/* Error/Success Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Create Admin User Section */}
        <div className="form-section">
          <h3>Create Admin User</h3>
          <form onSubmit={handleCreateAdmin}>
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
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Reprocess Month Section */}
        <div className="form-section">
          <h3>Reprocess Month</h3>
          <p style={{ marginBottom: '15px', color: '#dc3545', fontWeight: 'bold' }}>
            ⚠️ Warning: This will unlock the selected month and delete history data. Employee days will be preserved.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Select Month:</label>
              <input
                type="month"
                value={reprocessMonth}
                onChange={(e) => setReprocessMonth(e.target.value)}
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={handleReprocess} 
                className="btn-danger" 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Reprocess Month'}
              </button>
            </div>
          </div>
        </div>

        {/* Users Management Table */}
        <div className="table-section">
          <h3>Manage Users</h3>
          {users.length === 0 ? (
            <p className="no-data">No users found</p>
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
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.name || '-'}</td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase().replace(' ', '-')}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'Super Admin' && (
                        <div className="action-buttons">
                          <button 
                            className="btn-small btn-warning"
                            onClick={() => handleToggleActive(u.id, u.username, u.isActive)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? '🚫' : '✓'}
                          </button>
                          <button 
                            className="btn-small btn-info"
                            onClick={() => handleResetPassword(u.id, u.username)}
                            title="Reset Password"
                          >
                            🔑
                          </button>
                        </div>
                      )}
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

export default SuperAdminPage
