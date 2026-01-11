import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { historyAPI } from '../services/api'
import logoImage from '../assets/logo.png'
import ChangePasswordModal from '../components/ChangePasswordModal'
import Footer from '../components/Footer'
import './HistoryPage.css'

interface HistoryRecord {
  id: number;
  employeeNumber: string;
  employeeName: string;
  designation?: string;
  jobWeight: string;
  noOfDays: number;
  oldRateAmount: number;
  newRateAmount: number;
  month: Date;
  createdAt: Date;
}

function HistoryPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // User menu dropdown
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  
  // Redirect if not admin
  useEffect(() => {
    if (user.role !== 'Admin') {
      alert('Access denied. This page is only for Admin users.')
      navigate('/')
    }
  }, [user.role, navigate])
  
  // Search filters
  const [searchMonth, setSearchMonth] = useState('')
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('')
  
  // Results
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Search history
  const handleSearch = async () => {
    if (!searchMonth && !searchEmployeeNumber.trim()) {
      setError('Please enter at least Month or Employee Number to search')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSearched(true)
      
      const params: any = {}
      if (searchMonth) params.month = searchMonth
      if (searchEmployeeNumber.trim()) params.employeeNumber = searchEmployeeNumber.trim()
      
      const data = await historyAPI.search(params)
      setHistoryRecords(data)
      
      if (data.length === 0) {
        setError('No history records found for the specified criteria')
      }
    } catch (err: any) {
      setError(err.message)
      setHistoryRecords([])
    } finally {
      setLoading(false)
    }
  }

  // Clear search
  const handleClear = () => {
    setSearchMonth('')
    setSearchEmployeeNumber('')
    setHistoryRecords([])
    setError('')
    setSearched(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleChangePassword = () => {
    setShowDropdown(false)
    setShowChangePassword(true)
  }

  // Format month for display
  const formatMonth = (dateStr: Date) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
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
                <strong>{user.username}</strong>
                <span className="user-role">{user.role}</span>
              </div>
              <button onClick={handleChangePassword} className="dropdown-item">
                🔒 Change Password
              </button>
              <button onClick={handleLogout} className="dropdown-item">
                🚪 Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>

        <div className="page-header">
          <h2>Search Incentive History</h2>
        </div>

        {/* Search Form */}
        <div className="form-section">
          <h3>Search Criteria</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Month:</label>
              <input
                type="month"
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
                className="form-input"
                placeholder="Select month (optional)"
              />
            </div>
            <div className="form-group">
              <label>Employee Number:</label>
              <input
                type="text"
                value={searchEmployeeNumber}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow numbers
                  if (value === '' || /^\d+$/.test(value)) {
                    setSearchEmployeeNumber(value)
                  }
                }}
                className="form-input"
                placeholder="Enter employee number (optional)"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <button 
                onClick={handleSearch} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button 
                onClick={handleClear} 
                className="btn-secondary"
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Results Table */}
        {searched && (
          <div className="table-section">
            <h3>
              Search Results 
              {historyRecords.length > 0 && ` (${historyRecords.length} record${historyRecords.length !== 1 ? 's' : ''})`}
            </h3>

            {historyRecords.length === 0 ? (
              <p className="no-data">No records found</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Employee Number</th>
                    <th>Employee Name & Designation</th>
                    <th>Job Weight</th>
                    <th>No of Days</th>
                    <th>Net Amount (Old Rate)</th>
                    <th>Net Amount (New Rate)</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record) => {
                    const nameDesignation = record.designation 
                      ? `${record.employeeName} (${record.designation})`
                      : record.employeeName
                    
                    return (
                      <tr key={record.id}>
                        <td>{formatMonth(record.month)}</td>
                        <td>{record.employeeNumber}</td>
                        <td>{nameDesignation}</td>
                        <td>{record.jobWeight}</td>
                        <td>{record.noOfDays}</td>
                        <td>Rs. {record.oldRateAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td>Rs. {record.newRateAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      <Footer />

      {showChangePassword && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => alert('Password changed successfully!')}
        />
      )}
    </div>
  )
}

export default HistoryPage
