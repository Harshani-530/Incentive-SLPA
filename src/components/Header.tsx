import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/logo.png'
import ChangePasswordModal from './ChangePasswordModal'
import Toast from './Toast'
import './Header.css'

interface HeaderProps {
  username?: string
  role?: string
}

function Header({ username, role }: HeaderProps) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [toast, setToast] = useState<{
    isOpen: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  })
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Yes',
    danger: false,
    onConfirm: () => {}
  })
  const userMenuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleLogout = () => {
    setShowDropdown(false)
    setConfirmDialog({
      isOpen: true,
      title: 'Log Out?',
      message: 'Are you sure you want to log out?',
      confirmText: 'Yes',
      danger: true,
      onConfirm: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    })
  }

  return (
    <>
      <header className="app-header">
        <div className="logo-section">
          <div className="logo">
            <img src={logoImage} alt="SLPA Logo" className="logo-image" />
          </div>
        </div>
        <h1 className="app-title">Incentive Calculation System</h1>
        <div className="user-menu" ref={userMenuRef}>
          <div 
            className="user-profile" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <button className="user-icon">
              <i className="fi fi-sr-user"></i>
            </button>
            <div className="user-info">
              <span className="user-name">{username || 'User'}</span>
              <span className="user-role">{role || ''}</span>
            </div>
          </div>
          {showDropdown && (
            <div className="dropdown-menu" ref={dropdownRef}>
              <button className="dropdown-item" onClick={() => {
                setShowDropdown(false)
                setShowChangePassword(true)
              }}>
                <i className="fi fi-sr-lock" style={{ marginRight: '8px' }}></i> Change Password
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <i className="fi fi-sr-sign-out-alt" style={{ marginRight: '8px' }}></i> Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {showChangePassword && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false)
            setToast({ isOpen: true, message: 'Password changed successfully!', type: 'success' })
          }}
          onError={(message: string) => setToast({ isOpen: true, message, type: 'error' })}
        />
      )}

      {confirmDialog.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="modal-buttons">
              <button
                className={confirmDialog.danger ? 'modal-confirm-btn danger' : 'modal-confirm-btn'}
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog({ ...confirmDialog, isOpen: false })
                }}
              >
                {confirmDialog.confirmText}
              </button>
              <button
                className="modal-cancel-btn"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  )
}

export default Header
