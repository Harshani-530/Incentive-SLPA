import { useState } from 'react'
import './ChangePasswordModal.css'
import PasswordInput from './PasswordInput'
import { validatePassword } from '../utils/passwordValidator'

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function ChangePasswordModal({ isOpen, onClose, onSuccess, onError }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      onError('Please fill all fields')
      return
    }

    if (newPassword.length < 6) {
      onError('New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      onError('New passwords do not match')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:3001/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Show success and close
      onSuccess()
      onClose()
    } catch (err: any) {
      onError(err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="form-input"
            />
            <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Enter your current password
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => {
                const value = e.target.value
                setNewPassword(value)
                // Real-time validation
                if (value.trim()) {
                  const user = JSON.parse(localStorage.getItem('user') || '{}')
                  const validation = validatePassword(value, user.username || '')
                  setPasswordError(validation.errors.join('. '))
                } else {
                  setPasswordError('')
                }
              }}
              placeholder="Enter new password"
              className={`form-input ${passwordError ? 'input-error' : ''}`}
            />
            {passwordError && <small className="field-error">{passwordError}</small>}
            <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Must be 8+ chars with uppercase, lowercase, number, and special char (@#$%&*)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="form-input"
              disabled={!newPassword}
            />
            <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Re-enter new password to confirm
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
