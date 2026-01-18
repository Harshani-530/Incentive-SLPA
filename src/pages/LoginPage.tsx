import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'
import logoImage from '../assets/logo.png'
import Footer from '../components/Footer'
import PasswordInput from '../components/PasswordInput'
import Toast from '../components/Toast'

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
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
  
  // Check for session expiry
  useEffect(() => {
    const sessionExpired = localStorage.getItem('sessionExpired')
    if (sessionExpired === 'true') {
      setToast({ isOpen: true, message: 'Your session has expired due to inactivity. Please login again.', type: 'warning' })
      localStorage.removeItem('sessionExpired')
    }
  }, [])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase()
    
    // Apply restrictions
    // Only allow lowercase letters, numbers, dot, underscore
    value = value.replace(/[^a-z0-9._]/g, '')
    
    // Limit to 6 characters
    if (value.length > 6) {
      value = value.substring(0, 6)
    }
    
    setUsername(value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Remove spaces
    value = value.replace(/\s/g, '')
    
    // Only allow valid password characters (letters, numbers, special chars)
    value = value.replace(/[^a-zA-Z0-9@#$%&*]/g, '')
    
    setPassword(value)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setToast({ isOpen: true, message: 'Please enter username and password', type: 'error' })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect based on role
      if (data.user.role === 'Super Admin') {
        navigate('/super-admin')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setToast({ isOpen: true, message: err.message || 'Login failed. Please try again.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
        <div className="login-box">
          <div className="login-header">
            <img src={logoImage} alt="SLPA Logo" className="login-logo" />
            <h1>Incentive Calculation System</h1>
            <p>Please login to continue</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter username"
                className="form-input"
                autoFocus
                maxLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <PasswordInput
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
      
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  )
}

export default LoginPage
