import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { historyAPI, employeeAPI } from '../services/api'
import Toast from '../components/Toast'
import Header from '../components/Header'
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

interface Employee {
  id: number;
  employeeNumber: string;
  employeeName: string;
  jobWeight: string;
  designation?: string;
}

function HistoryPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // User menu dropdown
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
  
  // Redirect if not admin
  useEffect(() => {
    if (user.role !== 'Admin') {
      setToast({ isOpen: true, message: 'Access denied. This page is only for Admin users.', type: 'error' })
      setTimeout(() => navigate('/'), 2000)
    }
  }, [user.role, navigate])
  
  // Load employees for autocomplete
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await employeeAPI.getAll()
        setEmployees(data)
      } catch (err) {
        console.error('Failed to load employees:', err)
      }
    }
    loadEmployees()
  }, [])
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeInputRef.current && !employeeInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Search filters
  const [searchMonth, setSearchMonth] = useState('')
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('')
  
  // Employee autocomplete
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const employeeInputRef = useRef<HTMLDivElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])
  
  // Results
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Handle employee number change with autocomplete
  const handleEmployeeNumberChange = (value: string) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }
    
    setSearchEmployeeNumber(value)
    setSelectedSuggestionIndex(-1)
    
    // Show suggestions after 3 characters (same as HomePage)
    if (value.trim().length >= 3) {
      const matches = employees.filter(emp => 
        emp.employeeNumber.toLowerCase().includes(value.trim().toLowerCase())
      )
      setFilteredEmployees(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setShowSuggestions(false)
      setFilteredEmployees([])
    }
  }
  
  // Select employee from suggestions
  const handleSelectEmployee = (employee: Employee) => {
    setSearchEmployeeNumber(employee.employeeNumber)
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  // Handle keyboard navigation for suggestions
  const handleEmployeeNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredEmployees.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev < filteredEmployees.length - 1 ? prev + 1 : prev
          setTimeout(() => {
            suggestionRefs.current[newIndex]?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            })
          }, 0)
          return newIndex
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : -1
          setTimeout(() => {
            if (newIndex >= 0) {
              suggestionRefs.current[newIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              })
            }
          }, 0)
          return newIndex
        })
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredEmployees.length) {
          handleSelectEmployee(filteredEmployees[selectedSuggestionIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

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

  // Format month for display
  const formatMonth = (dateStr: Date) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  return (
    <div className="app-container">
      <Header username={user.username} role={user.role} />

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
            <div className="form-group" ref={employeeInputRef} style={{ position: 'relative' }}>
              <label>Employee Number:</label>
              <input
                type="text"
                value={searchEmployeeNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  handleEmployeeNumberChange(value)
                }}
                onKeyDown={handleEmployeeNumberKeyDown}
                className="form-input"
                placeholder="Enter employee number (numbers only)"
                autoComplete="off"
              />
              {/* Live Search Suggestions Dropdown */}
              {showSuggestions && filteredEmployees.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  marginTop: '2px'
                }}>
                  {filteredEmployees.map((emp, index) => (
                    <div
                      key={emp.employeeNumber}
                      ref={(el) => (suggestionRefs.current[index] = el)}
                      onClick={() => handleSelectEmployee(emp)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        transition: 'background-color 0.2s',
                        backgroundColor: selectedSuggestionIndex === index ? '#007bff' : 'white',
                        color: selectedSuggestionIndex === index ? 'white' : 'black'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSuggestionIndex !== index) {
                          e.currentTarget.style.backgroundColor = '#f0f0f0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSuggestionIndex !== index) {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.color = 'black'
                        }
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{emp.employeeNumber}</div>
                      <div style={{ fontSize: '0.9em', color: selectedSuggestionIndex === index ? '#fff' : '#666' }}>
                        {emp.employeeName} {emp.designation ? `(${emp.designation})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  )
}

export default HistoryPage
