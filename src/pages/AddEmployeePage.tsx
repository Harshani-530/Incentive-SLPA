import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AddEmployeePage.css'
import logoImage from '../assets/logo.png'
import { employeeAPI } from '../services/api'
import ChangePasswordModal from '../components/ChangePasswordModal'
import Footer from '../components/Footer'

interface Employee {
  id: number;
  employeeNumber: string;
  employeeName: string;
  designation?: string;
  jobWeight: string;
}

function AddEmployeePage() {
  const navigate = useNavigate()
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [designation, setDesignation] = useState('')
  const [jobWeight, setJobWeight] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editJobWeight, setEditJobWeight] = useState('')
  const [editDesignation, setEditDesignation] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Load employees from backend
  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await employeeAPI.getAll()
      setEmployees(data)
      setError('')
    } catch (err: any) {
      setError('Failed to load employees: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (employeeNumber && employeeName && jobWeight) {
      try {
        setLoading(true)
        await employeeAPI.create({
          employeeNumber,
          employeeName,
          designation,
          jobWeight
        })
        // Reload employees from backend
        await loadEmployees()
        // Clear form after save
        setEmployeeNumber('')
        setEmployeeName('')
        setDesignation('')
        setJobWeight('')
        setError('')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    } else {
      setError('Please fill all fields')
    }
  }

  const handleClear = () => {
    setEmployeeNumber('')
    setEmployeeName('')
    setDesignation('')
    setJobWeight('')
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditJobWeight(employees[index].jobWeight)
    setEditDesignation(employees[index].designation || '')
  }

  const handleSaveEdit = async (index: number) => {
    try {
      setLoading(true)
      const employee = employees[index]
      await employeeAPI.update(employee.id, { 
        jobWeight: editJobWeight,
        designation: editDesignation 
      })
      await loadEmployees()
      setEditingIndex(null)
      setEditJobWeight('')
      setEditDesignation('')
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditJobWeight('')
    setEditDesignation('')
  }

  const handleDelete = async (index: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        setLoading(true)
        const employee = employees[index]
        await employeeAPI.delete(employee.id)
        await loadEmployees()
        setError('')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
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
              <button className="dropdown-item" onClick={() => {
                setShowDropdown(false)
                setShowChangePassword(true)
              }}>
                🔒 Change Password
              </button>
              <button className="dropdown-item" onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                navigate('/login')
              }}>
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

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="page-card">
          <h2 className="page-title">Add Employee Details</h2>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="employee-number">Employee Number</label>
              <input
                id="employee-number"
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="text-input"
                placeholder="Enter employee number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee-name">Employee Name</label>
              <input
                id="employee-name"
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="text-input"
                placeholder="Enter employee name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="designation">Designation</label>
              <input
                id="designation"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="text-input"
                placeholder="Enter designation (optional)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="job-weight">Job Weight</label>
              <input
                id="job-weight"
                type="text"
                value={jobWeight}
                onChange={(e) => setJobWeight(e.target.value)}
                className="text-input"
                placeholder="Enter job weight"
              />
            </div>

            <div className="button-group">
              <button className="save-btn" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="clear-btn" onClick={handleClear}>Clear</button>
            </div>
          </div>

          <div className="table-section">
            <h3 className="table-title">Employee List</h3>
            {loading && <div className="loading-message">Loading...</div>}
            <table className="employee-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Employee Number</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Job Weight</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      No employees added yet
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{emp.employeeNumber}</td>
                      <td>{emp.employeeName}</td>
                      <td>
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="edit-input"
                            placeholder="Designation"
                          />
                        ) : (
                          emp.designation || '-'
                        )}
                      </td>
                      <td>
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={editJobWeight}
                            onChange={(e) => setEditJobWeight(e.target.value)}
                            className="edit-input"
                            placeholder="Job Weight"
                          />
                        ) : (
                          emp.jobWeight
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {editingIndex === index ? (
                            <>
                              <button 
                                className="save-action-btn"
                                onClick={() => handleSaveEdit(index)}
                                title="Save"
                              >
                                ✓
                              </button>
                              <button 
                                className="cancel-action-btn"
                                onClick={handleCancelEdit}
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="edit-action-btn"
                                onClick={() => handleEdit(index)}
                                title="Edit Job Weight"
                              >
                                ✎
                              </button>
                              <button 
                                className="delete-action-btn"
                                onClick={() => handleDelete(index)}
                                title="Delete"
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

export default AddEmployeePage
