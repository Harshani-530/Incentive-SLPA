import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './AddEmployeePage.css'
import logoImage from '../assets/logo.png'
import { employeeAPI, designationsAPI } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { validateName, filterNameInput, formatNameToProperCase } from '../utils/nameValidator'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Employee {
  id: number;
  employeeNumber: string;
  employeeName: string;
  designation?: string;
  jobWeight: string;
}

interface Designation {
  id: number;
  name: string;
}

function AddEmployeePage() {
  const navigate = useNavigate()
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [designation, setDesignation] = useState('')
  const [jobWeight, setJobWeight] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editJobWeight, setEditJobWeight] = useState('')
  const [editDesignation, setEditDesignation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  // Get logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Load employees from backend
  useEffect(() => {
    loadEmployees()
    loadDesignations()
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

  const loadDesignations = async () => {
    try {
      const data = await designationsAPI.getAll()
      setDesignations(data)
    } catch (err: any) {
      console.error('Failed to load designations:', err)
      // Don't show error to user, just log it
    }
  }

  const handleSave = async () => {
    if (employeeNumber && employeeName && jobWeight) {
      // Validate employee name
      const nameValidation = validateName(employeeName.trim())
      if (!nameValidation.valid) {
        setError(nameValidation.error || 'Invalid employee name')
        return
      }
      
      try {
        setLoading(true)
        const formattedName = formatNameToProperCase(employeeName.trim())
        await employeeAPI.create({
          employeeNumber,
          employeeName: formattedName,
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
        setToast({ isOpen: true, message: 'Employee added successfully!', type: 'success' })
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
      setToast({ isOpen: true, message: 'Employee updated successfully!', type: 'success' })
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

  const handleDelete = (index: number) => {
    const employee = employees[index]
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Employee?',
      message: `Are you sure you want to delete employee ${employee.employeeNumber} (${employee.employeeName})?\n\nThis action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          setLoading(true)
          await employeeAPI.delete(employee.id)
          await loadEmployees()
          setToast({ isOpen: true, message: `Employee ${employee.employeeNumber} deleted successfully!`, type: 'success' })
        } catch (err: any) {
          setToast({ isOpen: true, message: err.message, type: 'error' })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Generate PDF for Employee List
  const generateEmployeeListPDF = () => {
    const doc = new jsPDF()
    
    // Add logo at top-right corner
    const logoImg = new Image()
    logoImg.src = logoImage
    doc.addImage(logoImg, 'PNG', 150, 10, 50, 10)
    
    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Employee List', 14, 20)

    const tableData = employees.map((emp, index) => [
      index + 1,
      emp.employeeNumber,
      emp.employeeName,
      emp.designation || '-',
      emp.jobWeight
    ])

    autoTable(doc, {
      head: [['S/N', 'Employee Number', 'Employee Name', 'Designation', 'Job Weight']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9 },
    })

    // Add footer info below the table
    const finalY = (doc as any).lastAutoTable.finalY + 10
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated by: ${user.name || user.username}`, 14, finalY)
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, finalY + 5)

    doc.save(`Employee_List_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="app-container">
      <Header username={user.username} role={user.role} />

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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employee-number">Employee Number</label>
                <input
                  id="employee-number"
                  type="text"
                  value={employeeNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setEmployeeNumber(value)
                  }}
                  className="text-input"
                  placeholder="Enter employee number (numbers only)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="employee-name">Employee Name</label>
                <input
                  id="employee-name"
                  type="text"
                  value={employeeName}
                  onChange={(e) => {
                    const filtered = filterNameInput(e.target.value)
                    setEmployeeName(filtered)
                    if (filtered.trim()) {
                      const validation = validateName(filtered.trim())
                      setNameError(validation.valid ? '' : validation.error || '')
                    } else {
                      setNameError('')
                    }
                  }}
                  onBlur={() => {
                    if (employeeName.trim()) {
                      setEmployeeName(formatNameToProperCase(employeeName.trim()))
                    }
                  }}
                  className={`text-input ${nameError ? 'input-error' : ''}`}
                  placeholder="Enter employee name"
                  maxLength={50}
                />
                {nameError && <span className="field-error" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>{nameError}</span>}
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Letters, dots (.), and single spaces only, 2-30 characters, proper case
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="designation">Designation</label>
                <select
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="text-input"
                >
                  <option value="">Select designation (optional)</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
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
                          <select
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="edit-input"
                          >
                            <option value="">Select designation</option>
                            {designations.map((d) => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                          </select>
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
                                <i className="fi fi-sr-check"></i>
                              </button>
                              <button 
                                className="cancel-action-btn"
                                onClick={handleCancelEdit}
                                title="Cancel"
                              >
                                <i className="fi fi-sr-cross"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="edit-action-btn"
                                onClick={() => handleEdit(index)}
                                title="Edit Job Weight"
                              >
                                <i className="fi fi-sr-pencil"></i>
                              </button>
                              <button 
                                className="delete-action-btn"
                                onClick={() => handleDelete(index)}
                                title="Delete"
                              >
                                <i className="fi fi-sr-trash"></i>
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
            
            {/* PDF Generation Button */}
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={generateEmployeeListPDF} 
                className="save-btn"
                disabled={employees.length === 0}
              >
                <i className="fi fi-sr-document" style={{ marginRight: '8px' }}></i> Generate PDF (Employee List)
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

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

export default AddEmployeePage
