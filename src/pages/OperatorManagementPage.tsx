import { useNavigate } from 'react-router-dom'
import './OperatorManagementPage.css'
import { useState, useEffect, useRef } from 'react'
import { operatorsAPI } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { validateUsername } from '../utils/usernameValidator'
import { validatePassword } from '../utils/passwordValidator'
import { validateName, filterNameInput, formatNameToProperCase } from '../utils/nameValidator'
import PasswordInput from '../components/PasswordInput'

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
  
  // Password reset modal state
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetPasswordOperator, setResetPasswordOperator] = useState<{ id: number; username: string } | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [confirmResetPassword, setConfirmResetPassword] = useState('')
  const [resetPasswordError, setResetPasswordError] = useState('')
  
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
  const [passwordError, setPasswordError] = useState('')
  const [nameError, setNameError] = useState('')

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    danger?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    danger: false
  })

  // Toast state
  const [toast, setToast] = useState<{
    isOpen: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  })

  // Load operators on mount
  useEffect(() => {
    loadOperators()
  }, [])

  const loadOperators = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await operatorsAPI.getAll()
      setOperators(data)
    } catch (err: any) {
      // Check if it's an authentication error
      if (err.message.includes('Invalid token') || err.message.includes('token')) {
        setError('Session expired. Please log out and log in again.')
      } else {
        setError(err.message)
      }
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
    setPasswordError('')

    if (!newUsername.trim() || !newPassword.trim()) {
      setToast({ isOpen: true, message: 'Username and password are required', type: 'error' })
      return
    }

    // Validate username
    const usernameValidation = validateUsername(newUsername.trim(), newPassword)
    if (!usernameValidation.valid) {
      setToast({ isOpen: true, message: usernameValidation.error || 'Invalid username', type: 'error' })
      return
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword, newUsername.trim())
    if (!passwordValidation.isValid) {
      setToast({ isOpen: true, message: passwordValidation.errors.join('. '), type: 'error' })
      return
    }

    // Validate name if provided
    if (newName.trim()) {
      const nameValidation = validateName(newName.trim())
      if (!nameValidation.valid) {
        setToast({ isOpen: true, message: nameValidation.error || 'Invalid name', type: 'error' })
        return
      }
    }

    if (newPassword !== confirmPassword) {
      setToast({ isOpen: true, message: 'Passwords do not match', type: 'error' })
      return
    }

    try {
      setLoading(true)
      const formattedName = newName.trim() ? formatNameToProperCase(newName.trim()) : undefined
      await operatorsAPI.create({
        username: newUsername.trim(),
        password: newPassword,
        name: formattedName
      })
      setToast({ isOpen: true, message: 'Operator user created successfully!', type: 'success' })
      setNewUsername('')
      setNewName('')
      setNewPassword('')
      setConfirmPassword('')
      await loadOperators()
    } catch (err: any) {
      setToast({ isOpen: true, message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Toggle operator active status
  const handleToggleActive = (operatorId: number, username: string, isActive: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: `${isActive ? 'Deactivate' : 'Activate'} Operator?`,
      message: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} operator "${username}"?`,
      confirmText: isActive ? 'Deactivate' : 'Activate',
      danger: isActive,
      onConfirm: async () => {
        try {
          setLoading(true)
          await operatorsAPI.toggleActive(operatorId)
          setToast({ isOpen: true, message: `Operator "${username}" has been ${isActive ? 'deactivated' : 'activated'}`, type: 'success' })
          await loadOperators()
        } catch (err: any) {
          setToast({ isOpen: true, message: err.message, type: 'error' })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Reset operator password
  const handleResetPassword = (operatorId: number, username: string) => {
    setResetPasswordOperator({ id: operatorId, username })
    setNewPasswordInput('')
    setConfirmResetPassword('')
    setResetPasswordError('')
    setShowPasswordReset(true)
  }
  
  const handleResetPasswordChange = (value: string) => {
    setNewPasswordInput(value)
    
    if (value.length === 0) {
      setResetPasswordError('')
      return
    }
    
    const validation = validatePassword(value, resetPasswordOperator?.username || '')
    if (!validation.isValid) {
      setResetPasswordError(validation.errors.join('. '))
    } else {
      setResetPasswordError('')
    }
  }
  
  const handlePasswordResetSubmit = async () => {
    if (!resetPasswordOperator) return
    
    if (!newPasswordInput.trim()) {
      setToast({ isOpen: true, message: 'Please enter a new password', type: 'error' })
      return
    }
    
    const validation = validatePassword(newPasswordInput, resetPasswordOperator.username)
    if (!validation.isValid) {
      setToast({ isOpen: true, message: validation.errors.join('. '), type: 'error' })
      return
    }
    
    if (newPasswordInput !== confirmResetPassword) {
      setToast({ isOpen: true, message: 'Passwords do not match', type: 'error' })
      return
    }
    
    try {
      setLoading(true)
      await operatorsAPI.resetPassword(resetPasswordOperator.id, newPasswordInput)
      setToast({ isOpen: true, message: `Password reset successfully for operator "${resetPasswordOperator.username}"`, type: 'success' })
      setShowPasswordReset(false)
      setResetPasswordOperator(null)
      setNewPasswordInput('')
    } catch (err: any) {
      setToast({ isOpen: true, message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Delete operator
  const handleDeleteOperator = (operatorId: number, username: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Operator?',
      message: `Are you sure you want to permanently delete operator "${username}"?\n\nThis action cannot be undone!`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
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
    })
  }

  return (
    <div className="app-container">
      <Header username={user.username} role={user.role} />

      <main className="main-content">
        <div className="page-header">
          <h2>Operator Management</h2>
          <button className="add-employee-btn" onClick={() => navigate('/')}>
            &#8592; Back to Home
          </button>
        </div>

        {/* Create Operator Section */}
        <div className="form-section">
          <h3>Create Operator User</h3>
          <form onSubmit={handleCreateOperator}>
            <div className="form-row">
              <div className="form-group">
                <label>Username:</label>
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
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  2-6 characters, lowercase start, alphanumeric with . or _
                </small>
              </div>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    const filtered = filterNameInput(e.target.value)
                    setNewName(filtered)
                    if (filtered.trim()) {
                      const validation = validateName(filtered.trim())
                      setNameError(validation.valid ? '' : validation.error || '')
                    } else {
                      setNameError('')
                    }
                  }}
                  onBlur={() => {
                    if (newName.trim()) {
                      setNewName(formatNameToProperCase(newName.trim()))
                    }
                  }}
                  placeholder="Enter full name"
                  className={`form-input ${nameError ? 'input-error' : ''}`}
                  maxLength={30}
                />
                {nameError && <span className="field-error">{nameError}</span>}
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Letters, dots (.), and single spaces only, 2-30 characters, proper case
                </small>
              </div>
              <div className="form-group">
                <label>Password:</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewPassword(value)
                    // Real-time validation
                    if (value.trim()) {
                      const validation = validatePassword(value, newUsername.trim())
                      setPasswordError(validation.errors.join('. '))
                    } else {
                      setPasswordError('')
                    }
                  }}
                  placeholder="Enter password"
                  className={`form-input ${passwordError ? 'input-error' : ''}`}
                />
                {passwordError && <small className="field-error">{passwordError}</small>}
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Must be 8+ chars with uppercase, lowercase, number, and special char (@#$%&*)
                </small>
              </div>
              <div className="form-group">
                <label>Confirm Password:</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="form-input"
                  disabled={!newPassword}
                />
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Re-enter password to confirm
                </small>
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
                          {op.isActive ? <i className="fi fi-sr-cross-circle"></i> : <i className="fi fi-sr-check-circle"></i>}
                        </button>
                        <button 
                          className="btn-small btn-info"
                          onClick={() => handleResetPassword(op.id, op.username)}
                          title="Reset Password"
                        >
                          <i className="fi fi-sr-key"></i>
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

      {/* Password Reset Modal */}
      {showPasswordReset && resetPasswordOperator && (
        <div className="modal-overlay" onClick={() => setShowPasswordReset(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Reset Password for "{resetPasswordOperator.username}"</h2>
              <button className="modal-close" onClick={() => setShowPasswordReset(false)}>×</button>
            </div>
            <div className="modal-form" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>New Password</label>
                <PasswordInput
                  value={newPasswordInput}
                  onChange={(e) => handleResetPasswordChange(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                  autoFocus
                />
                {resetPasswordError && (
                  <small style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {resetPasswordError}
                  </small>
                )}
                {!resetPasswordError && newPasswordInput.length > 0 && (
                  <small style={{ color: '#28a745', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    <i className="fi fi-sr-check" style={{ marginRight: '4px' }}></i> Password is valid
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <PasswordInput
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input"
                  disabled={!newPasswordInput}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowPasswordReset(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handlePasswordResetSubmit}
                  disabled={loading || !!resetPasswordError || !newPasswordInput || newPasswordInput !== confirmResetPassword}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        danger={confirmDialog.danger}
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  )
}

export default OperatorManagementPage
