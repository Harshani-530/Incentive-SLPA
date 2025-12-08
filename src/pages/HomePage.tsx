import { useNavigate } from 'react-router-dom'
import './HomePage.css'
import logoImage from '../assets/logo.png'
import { useState, useEffect } from 'react'
import { employeeAPI, employeeDaysAPI, processAPI, monthlyReportsAPI } from '../services/api'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ChangePasswordModal from '../components/ChangePasswordModal'
import Footer from '../components/Footer'

interface Employee {
  employeeNumber: string;
  employeeName: string;
  designation?: string;
  jobWeight: string;
}

interface EmployeeDays {
  id: number;
  employeeNumber: string;
  employeeName?: string;
  designation?: string;
  jobWeight?: string;
  noOfDays: number;
  month: Date;
}

interface ProcessResult {
  employeeNumber: string;
  employeeName: string;
  jobWeight: number;
  noOfDays: number;
  unit: number;
  netAmount: number;
}

function HomePage() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  
  // Get logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // Current month (YYYY-MM format)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Add employee days form
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [designation, setDesignation] = useState('')
  const [jobWeight, setJobWeight] = useState('')
  const [noOfDays, setNoOfDays] = useState('')
  
  // Employee days for selected month
  const [employeeDaysList, setEmployeeDaysList] = useState<EmployeeDays[]>([])
  
  // Processing inputs
  const [gateMovement, setGateMovement] = useState('')
  const [vesselAmount, setVesselAmount] = useState('')
  
  // Processing results
  const [oldRateResults, setOldRateResults] = useState<ProcessResult[]>([])
  const [newRateResults, setNewRateResults] = useState<ProcessResult[]>([])
  const [processDetails, setProcessDetails] = useState<any>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employeeCache, setEmployeeCache] = useState<Employee[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editNoOfDays, setEditNoOfDays] = useState('')
  
  // Monthly report status
  const [monthlyReport, setMonthlyReport] = useState<any>(null)

  // Helper functions for number formatting
  const formatNumber = (value: string): string => {
    if (!value) return ''
    const number = parseFloat(value.replace(/,/g, ''))
    if (isNaN(number)) return ''
    return number.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2})
  }

  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '')
  }

  // Load employees and employee days on mount or month change
  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    loadEmployeeDays()
    loadMonthlyReport()
  }, [selectedMonth])

  const loadEmployees = async () => {
    try {
      const data = await employeeAPI.getAll()
      setEmployeeCache(data)
    } catch (err: any) {
      console.error('Failed to load employees:', err)
    }
  }

  const loadEmployeeDays = async () => {
    try {
      setLoading(true)
      const data = await employeeDaysAPI.getByMonth(selectedMonth)
      setEmployeeDaysList(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlyReport = async () => {
    try {
      const data = await monthlyReportsAPI.getByMonth(selectedMonth)
      setMonthlyReport(data)
    } catch (err: any) {
      console.error('Failed to load monthly report:', err)
    }
  }

  // Auto-fill employee details when employee number is entered
  const handleEmployeeNumberChange = async (value: string) => {
    setEmployeeNumber(value)
    setError('')
    
    if (value.trim()) {
      // First check cache
      const emp = employeeCache.find(e => e.employeeNumber === value.trim())
      if (emp) {
        setEmployeeName(emp.employeeName)
        setDesignation(emp.designation || '')
        setJobWeight(emp.jobWeight)
      } else if (value.trim().length >= 3) {
        // Only call API if at least 3 characters entered
        try {
          const emp = await employeeAPI.getByNumber(value.trim())
          if (emp) {
            setEmployeeName(emp.employeeName)
            setDesignation(emp.designation || '')
            setJobWeight(emp.jobWeight)
            // Add to cache
            setEmployeeCache(prev => [...prev.filter(e => e.employeeNumber !== emp.employeeNumber), emp])
          } else {
            // Don't clear fields yet, user might still be typing
            if (value.trim().length > 3) {
              setEmployeeName('')
              setDesignation('')
              setJobWeight('')
            }
          }
        } catch (err) {
          // Silently fail if employee not found (user might still be typing)
          console.log('Employee not found or still typing:', value)
        }
      } else {
        // Clear if less than 3 characters and not in cache
        setEmployeeName('')
        setDesignation('')
        setJobWeight('')
      }
    } else {
      setEmployeeName('')
      setDesignation('')
      setJobWeight('')
    }
  }

  // Save employee days
  const handleSaveEmployeeDays = async () => {
    if (!employeeNumber.trim() || !noOfDays.trim()) {
      setError('Please enter employee number and number of days')
      return
    }

    const days = parseInt(noOfDays)
    if (isNaN(days) || days <= 0) {
      setError('Please enter a valid number of days (whole numbers only)')
      return
    }

    try {
      setLoading(true)
      setError('')
      await employeeDaysAPI.save({
        employeeNumber: employeeNumber.trim(),
        noOfDays: days,
        month: selectedMonth
      })
      
      // Clear form
      setEmployeeNumber('')
      setEmployeeName('')
      setDesignation('')
      setJobWeight('')
      setNoOfDays('')
      
      // Reload employee days
      await loadEmployeeDays()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Clear employee days form
  const handleClearEmployeeDaysForm = () => {
    setEmployeeNumber('')
    setEmployeeName('')
    setDesignation('')
    setJobWeight('')
    setNoOfDays('')
    setError('')
  }

  // Edit employee days
  const handleEditEmployeeDays = (index: number) => {
    setEditingIndex(index)
    setEditNoOfDays(employeeDaysList[index].noOfDays.toString())
  }

  // Save edited employee days
  const handleSaveEditEmployeeDays = async (index: number) => {
    const ed = employeeDaysList[index]
    const days = parseInt(editNoOfDays)
    if (isNaN(days) || days <= 0) {
      setError('Please enter a valid number of days (whole numbers only)')
      return
    }
    try {
      setLoading(true)
      await employeeDaysAPI.save({
        employeeNumber: ed.employeeNumber,
        noOfDays: days,
        month: selectedMonth
      })
      await loadEmployeeDays()
      setEditingIndex(null)
      setEditNoOfDays('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cancel edit
  const handleCancelEditEmployeeDays = () => {
    setEditingIndex(null)
    setEditNoOfDays('')
  }

  // Delete employee days
  const handleDeleteEmployeeDays = async (id: number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        setLoading(true)
        await employeeDaysAPI.delete(id)
        await loadEmployeeDays()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Process calculations
  const handleProcess = async () => {
    if (!gateMovement.trim() || !vesselAmount.trim()) {
      setError('Please enter Gate Movement and Vessel Amount')
      return
    }

    if (employeeDaysList.length === 0) {
      setError('No employee days found for the selected month')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await processAPI.process({
        gateMovement: parseFloat(parseFormattedNumber(gateMovement)),
        vesselAmount: parseFloat(parseFormattedNumber(vesselAmount)),
        month: selectedMonth,
        recordedBy: 'admin'
      })

      setOldRateResults(result.oldRateResults || [])
      setNewRateResults(result.newRateResults || [])
      setProcessDetails(result.details)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Export to Excel
  const exportToExcel = (type: 'old' | 'new' | 'both') => {
    const wb = XLSX.utils.book_new()

    if (type === 'both') {
      // Combined sheet with both old and new rates
      const oldTotal = oldRateResults.reduce((sum, r) => sum + r.netAmount, 0)
      const newTotal = newRateResults.reduce((sum, r) => sum + r.netAmount, 0)
      
      let wsData
      if (user.role === 'Admin') {
        wsData = [
          ['Employee Number', 'Employee Name', 'Job Weight', 'No of Days', 'Net Amount (Old Rate) Rs.', 'Net Amount (New Rate) Rs.'],
          ...oldRateResults.map((r, idx) => {
            const newRate = newRateResults[idx]
            return [
              r.employeeNumber,
              r.employeeName,
              r.jobWeight,
              r.noOfDays,
              `Rs. ${r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
              newRate ? `Rs. ${newRate.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : ''
            ]
          }),
          ['', '', '', 'Total Net Amount:', `Rs. ${oldTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, `Rs. ${newTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
        ]
      } else {
        wsData = [
          ['Employee Number', 'Employee Name', 'Job Weight', 'No of Days'],
          ...oldRateResults.map(r => [
            r.employeeNumber,
            r.employeeName,
            r.jobWeight,
            r.noOfDays
          ]),
          ['', '', 'Total Net Amount (Old Rate):', `Rs. ${oldTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
          ['', '', 'Total Net Amount (New Rate):', `Rs. ${newTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
        ]
      }
      if (processDetails) {
        wsData.push([])
        wsData.push(['Details'])
        wsData.push(['Gate Movement (Units)', processDetails.a])
        wsData.push(['Vessel Amount (Rs.)', `Rs. ${processDetails.b.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`])
        wsData.push(['Old Rate (c)', processDetails.c])
        wsData.push(['New Rate (d)', processDetails.d])
        wsData.push(['Sum (g)', processDetails.g])
        wsData.push(['h = a * c', processDetails.h])
        wsData.push(['i = a * d', processDetails.i])
        wsData.push(['Net Amount per Unit (j) - Old', processDetails.j])
        wsData.push(['Net Amount per Unit (k) - New', processDetails.k])
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Both Rates')
    } else if (type === 'old') {
      const oldTotal = oldRateResults.reduce((sum, r) => sum + r.netAmount, 0)
      
      let wsData
      if (user.role === 'Admin') {
        wsData = [
          ['Employee Number', 'Employee Name', 'Job Weight', 'No of Days', 'Net Amount (Old Rate) Rs.'],
          ...oldRateResults.map(r => [
            r.employeeNumber,
            r.employeeName,
            r.jobWeight,
            r.noOfDays,
            `Rs. ${r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
          ]),
          ['', '', '', 'Total Net Amount:', `Rs. ${oldTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
        ]
      } else {
        wsData = [
          ['Employee Number', 'Employee Name', 'Job Weight', 'No of Days'],
          ...oldRateResults.map(r => [
            r.employeeNumber,
            r.employeeName,
            r.jobWeight,
            r.noOfDays
          ]),
          ['', '', 'Total Net Amount:', `Rs. ${oldTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
        ]
      }
      if (processDetails) {
        wsData.push([])
        wsData.push(['Details'])
        wsData.push(['Gate Movement (Units)', processDetails.a])
        wsData.push(['Vessel Amount (Rs.)', `Rs. ${processDetails.b.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`])
        wsData.push(['Old Rate (c)', processDetails.c])
        wsData.push(['Sum (g)', processDetails.g])
        wsData.push(['h = a * c', processDetails.h])
        wsData.push(['Net Amount per Unit (j)', processDetails.j])
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Old Rate')
    } else if (type === 'new') {
      const newTotal = newRateResults.reduce((sum, r) => sum + r.netAmount, 0)
      
      let wsData
      if (user.role === 'Admin') {
        wsData = [
          ['S/N', 'EMPLOYEE NUMBER', 'EMPLOYEE NAME & DESIGNATION', 'NET AMOUNT (Rs.)'],
          ...newRateResults.map((r, index) => [
            index + 1,
            r.employeeNumber,
            r.employeeName,
            r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
          ])
        ]
      } else {
        wsData = [
          ['S/N', 'EMPLOYEE NUMBER', 'EMPLOYEE NAME & DESIGNATION'],
          ...newRateResults.map((r, index) => [
            index + 1,
            r.employeeNumber,
            r.employeeName
          ])
        ]
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'New Rate')
    }

    const filename = type === 'both' 
      ? `Incentive_Both_Rates_${selectedMonth}.xlsx`
      : `Incentive_${type === 'old' ? 'Old' : 'New'}_Rate_${selectedMonth}.xlsx`
    
    XLSX.writeFile(wb, filename)
  }

  // Generate PDF for Operator (Employee Days Table)
  const generateOperatorPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('Employee Days Report', 14, 15)
    doc.setFontSize(10)
    doc.text(`Month: ${selectedMonth}`, 14, 22)
    doc.text(`Generated by: ${user.username} (${user.role})`, 14, 28)
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 34)

    const tableData = employeeDaysList.map(ed => {
      const employee = employeeCache.find(e => e.employeeNumber === ed.employeeNumber)
      const displayName = employee 
        ? employee.designation 
          ? `${employee.employeeName} (${employee.designation})`
          : employee.employeeName
        : ed.employeeName || 'Unknown'
      
      return [
        ed.employeeNumber,
        displayName,
        employee?.jobWeight || '-',
        ed.noOfDays
      ]
    })

    autoTable(doc, {
      head: [['Employee Number', 'Employee Name', 'Job Weight', 'No of Days']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    })

    doc.save(`Employee_Days_${selectedMonth}_${user.username}.pdf`)
  }

  // Generate PDF for Admin (Old/New Rate Results)
  const generateAdminPDF = (type: 'old' | 'new') => {
    const doc = new jsPDF()
    const results = type === 'old' ? oldRateResults : newRateResults
    const total = results.reduce((sum, r) => sum + r.netAmount, 0)
    
    doc.setFontSize(16)
    doc.text(`${type === 'old' ? 'Old' : 'New'} Rate Results`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Month: ${selectedMonth}`, 14, 22)
    doc.text(`Generated by: ${user.username} (${user.role})`, 14, 28)
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 34)

    const tableData = results.map(r => [
      r.employeeNumber,
      r.employeeName,
      r.jobWeight,
      r.noOfDays,
      `Rs. ${r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
    ])

    autoTable(doc, {
      head: [['Employee Number', 'Employee Name', 'Job Weight', 'No of Days', 'Net Amount (Rs.)']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      foot: [['', '', '', 'Total:', `Rs. ${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]],
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    })

    if (processDetails) {
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.text('Calculation Details:', 14, finalY)
      doc.setFontSize(10)
      doc.text(`Gate Movement (Units): ${processDetails.a}`, 14, finalY + 7)
      doc.text(`Vessel Amount (Rs.): Rs. ${processDetails.b.toLocaleString('en-US')}`, 14, finalY + 14)
      doc.text(`${type === 'old' ? 'Old' : 'New'} Rate: ${type === 'old' ? processDetails.c : processDetails.d}`, 14, finalY + 21)
      doc.text(`Sum (g): ${processDetails.g}`, 14, finalY + 28)
      doc.text(`Net Amount per Unit: ${type === 'old' ? processDetails.j : processDetails.k}`, 14, finalY + 35)
    }

    doc.save(`${type === 'old' ? 'Old' : 'New'}_Rate_Results_${selectedMonth}_${user.username}.pdf`)
  }

  // Operator Finish
  const handleOperatorFinish = async () => {
    if (employeeDaysList.length === 0) {
      setError('No employee days to finish. Please add employee days first.')
      return
    }

    if (confirm('Are you sure you want to finish? This will lock the Employee Days table for this month.')) {
      try {
        setLoading(true)
        setError('')
        await monthlyReportsAPI.operatorFinish(selectedMonth)
        await loadMonthlyReport()
        alert('Employee Days table has been locked successfully!')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Admin Finish
  const handleAdminFinish = async () => {
    if (!gateMovement.trim() || !vesselAmount.trim()) {
      setError('Please enter Gate Movement and Vessel Amount before finishing')
      return
    }

    if (oldRateResults.length === 0 && newRateResults.length === 0) {
      setError('Please process calculations before finishing')
      return
    }

    if (confirm('Are you sure you want to finish? This will finalize all data for this month and lock everything.')) {
      try {
        setLoading(true)
        setError('')
        await monthlyReportsAPI.adminFinish({
          month: selectedMonth,
          gateMovement: parseFloat(parseFormattedNumber(gateMovement)),
          vesselAmount: parseFloat(parseFormattedNumber(vesselAmount))
        })
        await loadMonthlyReport()
        alert('Month has been finalized successfully! You can now generate final Excel reports.')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Override (Unlock)
  const handleOverride = async () => {
    if (confirm('Are you sure you want to override and unlock this month? This will allow editing again.')) {
      try {
        setLoading(true)
        setError('')
        await monthlyReportsAPI.override(selectedMonth)
        await loadMonthlyReport()
        alert('Month has been unlocked successfully!')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Check if month is locked
  const isOperatorFinished = monthlyReport?.status === 'operator_finished' || monthlyReport?.status === 'admin_finished'
  const isAdminFinished = monthlyReport?.status === 'admin_finished'

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
        <div className="page-header">
          <button className="add-employee-btn" onClick={() => navigate('/add-employee')}>
            + Add New Employee
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}

        {/* Month Selector */}
        <div className="form-section">
          <h3>Select Month</h3>
          <div className="form-group">
            <label>Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Add Employee Days */}
        <div className="form-section">
          <h3>Add Employee Days for {selectedMonth}</h3>
          {isOperatorFinished && (
            <div style={{ padding: '10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '10px' }}>
              ⚠️ This month has been {isAdminFinished ? 'finalized by Admin' : 'locked by Operator'}. Use Override button to unlock for editing.
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Employee Number:</label>
              <input
                type="text"
                value={employeeNumber}
                onChange={(e) => handleEmployeeNumberChange(e.target.value)}
                placeholder="Enter employee number"
                className="form-input"
                disabled={isOperatorFinished}
              />
            </div>
            <div className="form-group">
              <label>Employee Name:</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Auto-filled or enter manually"
                className="form-input"
                disabled={isOperatorFinished}
              />
            </div>
            <div className="form-group">
              <label>Designation:</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Auto-filled or enter manually"
                className="form-input"
                disabled={isOperatorFinished}
              />
            </div>
            <div className="form-group">
              <label>Job Weight:</label>
              <input
                type="text"
                value={jobWeight}
                readOnly
                placeholder="Auto-filled"
                className="form-input readonly"
              />
            </div>
            <div className="form-group">
              <label>No of Days:</label>
              <input
                type="text"
                value={noOfDays}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setNoOfDays(value)
                }}
                placeholder="Enter days (whole numbers only)"
                className="form-input"
                disabled={isOperatorFinished}
              />
            </div>
            <button onClick={handleSaveEmployeeDays} className="btn-primary" disabled={loading || isOperatorFinished}>
              {loading ? 'Saving...' : 'Add'}
            </button>
            <button onClick={handleClearEmployeeDaysForm} className="btn-secondary" disabled={isOperatorFinished}>
              Clear
            </button>
          </div>
        </div>

        {/* Employee Days Table */}
        <div className="table-section">
          <h3>Employee Days for {selectedMonth}</h3>
          {employeeDaysList.length === 0 ? (
            <p className="no-data">No employee days added for this month</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Number</th>
                  <th>Employee Name</th>
                  <th>Job Weight</th>
                  <th>No of Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeeDaysList.map((ed, index) => {
                  const employee = employeeCache.find(e => e.employeeNumber === ed.employeeNumber)
                  const displayName = employee 
                    ? employee.designation 
                      ? `${employee.employeeName} (${employee.designation})`
                      : employee.employeeName
                    : ed.employeeName || 'Unknown'
                  return (
                    <tr key={ed.id}>
                      <td>{ed.employeeNumber}</td>
                      <td>{displayName}</td>
                      <td>{employee?.jobWeight || '-'}</td>
                      <td>
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={editNoOfDays}
                            onChange={(e) => setEditNoOfDays(e.target.value)}
                            className="edit-input"
                            step="1"
                          />
                        ) : (
                          ed.noOfDays
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {editingIndex === index ? (
                            <>
                              <button 
                                className="save-action-btn"
                                onClick={() => handleSaveEditEmployeeDays(index)}
                                title="Save"
                                disabled={isOperatorFinished}
                              >
                                ✓
                              </button>
                              <button 
                                className="cancel-action-btn"
                                onClick={handleCancelEditEmployeeDays}
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="edit-action-btn"
                                onClick={() => handleEditEmployeeDays(index)}
                                title="Edit No of Days"
                                disabled={isOperatorFinished}
                              >
                                ✎
                              </button>
                              <button 
                                className="delete-action-btn"
                                onClick={() => handleDeleteEmployeeDays(ed.id)}
                                title="Delete"
                                disabled={isOperatorFinished}
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          
          {/* Operator/Admin Actions */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* PDF Generation for Operator */}
            <button 
              onClick={generateOperatorPDF} 
              className="btn-secondary"
              disabled={employeeDaysList.length === 0}
            >
              📄 Generate PDF (Employee Days)
            </button>
            
            {/* Operator Finish Button */}
            {user.role === 'Operator' && !isOperatorFinished && (
              <button 
                onClick={handleOperatorFinish} 
                className="btn-primary"
                disabled={employeeDaysList.length === 0 || loading}
              >
                ✓ Finish (Lock Employee Days)
              </button>
            )}
            
            {/* Override Button */}
            {(isOperatorFinished || isAdminFinished) && (
              <button 
                onClick={handleOverride} 
                className="btn-secondary"
                style={{ background: '#dc3545', color: 'white' }}
                disabled={loading}
              >
                🔓 Override (Unlock for Testing)
              </button>
            )}
          </div>
        </div>

        {/* Processing Section - Only visible to Admin */}
        {user.role === 'Admin' && (
          <>
        <div className="form-section">
          <h3>Process Calculations for {selectedMonth}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Gate Movement (Units):</label>
              <input
                type="text"
                value={gateMovement}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setGateMovement(value)
                }}
                onBlur={(e) => {
                  if (e.target.value) {
                    setGateMovement(formatNumber(e.target.value))
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value) {
                    setGateMovement(parseFormattedNumber(e.target.value))
                  }
                }}
                placeholder="Enter gate movement"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Vessel Amount (Rs.):</label>
              <input
                type="text"
                value={vesselAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setVesselAmount(value)
                }}
                onBlur={(e) => {
                  if (e.target.value) {
                    setVesselAmount(formatNumber(e.target.value))
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value) {
                    setVesselAmount(parseFormattedNumber(e.target.value))
                  }
                }}
                placeholder="Enter vessel amount"
                className="form-input"
              />
            </div>
            <button onClick={handleProcess} className="btn-primary btn-large" disabled={loading}>
              {loading ? 'Processing...' : 'Process'}
            </button>
            <button onClick={() => { setGateMovement(''); setVesselAmount(''); setOldRateResults([]); setNewRateResults([]); setProcessDetails(null); }} className="btn-secondary">
              Clear
            </button>
          </div>
        </div>

        {/* Results - Old Rate */}
        {oldRateResults.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h3>Old Rate Results {processDetails && `(Rate: ${processDetails.c})`}</h3>
              <button onClick={() => exportToExcel('old')} className="btn-success">
                Export Old Rate
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Number</th>
                  <th>Employee Name</th>
                  <th>Job Weight</th>
                  <th>No of Days</th>
                  {user.role === 'Admin' && <th>Net Amount (Rs.)</th>}
                </tr>
              </thead>
              <tbody>
                {oldRateResults.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.employeeNumber}</td>
                    <td>{r.employeeName}</td>
                    <td>{r.jobWeight}</td>
                    <td>{r.noOfDays}</td>
                    {user.role === 'Admin' && <td>Rs. {r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={user.role === 'Admin' ? 4 : 4} style={{textAlign: 'right', fontWeight: 'bold'}}>Total Net Amount:</td>
                  <td style={{fontWeight: 'bold'}}>
                    Rs. {oldRateResults.reduce((sum, r) => sum + r.netAmount, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Results - New Rate */}
        {newRateResults.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h3>New Rate Results {processDetails && `(Rate: ${processDetails.d})`}</h3>
              <button onClick={() => exportToExcel('new')} className="btn-success">
                Export New Rate
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Number</th>
                  <th>Employee Name</th>
                  <th>Job Weight</th>
                  <th>No of Days</th>
                  {user.role === 'Admin' && <th>Net Amount (Rs.)</th>}
                </tr>
              </thead>
              <tbody>
                {newRateResults.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.employeeNumber}</td>
                    <td>{r.employeeName}</td>
                    <td>{r.jobWeight}</td>
                    <td>{r.noOfDays}</td>
                    {user.role === 'Admin' && <td>Rs. {r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={user.role === 'Admin' ? 4 : 4} style={{textAlign: 'right', fontWeight: 'bold'}}>Total Net Amount:</td>
                  <td style={{fontWeight: 'bold'}}>
                    Rs. {newRateResults.reduce((sum, r) => sum + r.netAmount, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Export Both Button */}
        {oldRateResults.length > 0 && newRateResults.length > 0 && (
          <div className="export-section">
            <button onClick={() => exportToExcel('both')} className="btn-success btn-large">
              Export Both Rates
            </button>
          </div>
        )}

        {/* Admin Actions - PDF and Finish */}
        {(oldRateResults.length > 0 || newRateResults.length > 0) && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {oldRateResults.length > 0 && (
              <button 
                onClick={() => generateAdminPDF('old')} 
                className="btn-secondary"
              >
                📄 Generate PDF (Old Rate)
              </button>
            )}
            {newRateResults.length > 0 && (
              <button 
                onClick={() => generateAdminPDF('new')} 
                className="btn-secondary"
              >
                📄 Generate PDF (New Rate)
              </button>
            )}
            
            {!isAdminFinished && (
              <button 
                onClick={handleAdminFinish} 
                className="btn-primary"
                disabled={loading}
              >
                ✓ Admin Finish (Finalize Month)
              </button>
            )}
          </div>
        )}

        {/* Final Excel After Admin Finish */}
        {isAdminFinished && oldRateResults.length > 0 && newRateResults.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#155724' }}>
              ✓ This month has been finalized. Generate final Excel reports:
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => exportToExcel('old')} className="btn-success">
                📊 Final Excel (Old Rate)
              </button>
              <button onClick={() => exportToExcel('new')} className="btn-success">
                📊 Final Excel (New Rate)
              </button>
              <button onClick={() => exportToExcel('both')} className="btn-success">
                📊 Final Excel (Both Rates)
              </button>
            </div>
          </div>
        )}
        </>
        )}
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

export default HomePage
