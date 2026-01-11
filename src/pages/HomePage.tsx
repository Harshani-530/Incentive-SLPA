import { useNavigate } from 'react-router-dom'
import './HomePage.css'
import logoImage from '../assets/logo.png'
import { useState, useEffect, useRef } from 'react'
import { employeeAPI, employeeDaysAPI, processAPI, monthlyReportsAPI, historyAPI, ratesAPI } from '../services/api'
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

interface Rate {
  name: string;
  value: number;
  code?: string;
  installments?: string;
  isActive: boolean;
}

function HomePage() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [rates, setRates] = useState<Rate[]>([])
  
  // Get logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // Current month (YYYY-MM format) - Auto set to previous month
  const [selectedMonth] = useState(() => {
    const now = new Date()
    // Set to previous month
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Add employee days form
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [designation, setDesignation] = useState('')
  const [jobWeight, setJobWeight] = useState('')
  const [noOfDays, setNoOfDays] = useState('')
  
  // Employee days for selected month
  const [employeeDaysList, setEmployeeDaysList] = useState<EmployeeDays[]>([])
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('')
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false)
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  
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
  
  // State to control Process Calculations visibility
  const [showProcessCalculations, setShowProcessCalculations] = useState(false)
  
  // State to track if employee days are locked for the month
  const [employeeDaysFinished, setEmployeeDaysFinished] = useState(false)
  
  // Refs for input focus management
  const employeeNumberRef = useRef<HTMLInputElement>(null)
  const noOfDaysRef = useRef<HTMLInputElement>(null)

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
    const fetchRates = async () => {
      try {
        const data = await ratesAPI.getAll()
        setRates(data)
      } catch (error) {
        console.error('Failed to fetch rates:', error)
      }
    }
    fetchRates()
  }, [])

  useEffect(() => {
    loadEmployeeDays()
    loadMonthlyReport()
    
    // Load finalized month data if month is admin_finished
    const checkMonthStatus = async () => {
      try {
        const report = await monthlyReportsAPI.getByMonth(selectedMonth)
        const isFinalized = report?.status === 'admin_finished'
        const isEmployeeDaysLocked = report?.status === 'employee_days_locked' || report?.status === 'admin_finished'
        
        setEmployeeDaysFinished(isEmployeeDaysLocked)
        setShowProcessCalculations(isEmployeeDaysLocked)
        
        if (isFinalized) {
          const savedDataKey = `monthData_${selectedMonth}`
          const savedData = localStorage.getItem(savedDataKey)
          if (savedData) {
            const data = JSON.parse(savedData)
            setGateMovement(data.gateMovement || '')
            setVesselAmount(data.vesselAmount || '')
            setOldRateResults(data.oldRateResults || [])
            setNewRateResults(data.newRateResults || [])
            setProcessDetails(data.processDetails || null)
            setShowProcessCalculations(true)
          }
        } else {
          // Clear data if month is not finalized
          setGateMovement('')
          setVesselAmount('')
          setOldRateResults([])
          setNewRateResults([])
          setProcessDetails(null)
        }
      } catch (err) {
        console.error('Failed to check month status:', err)
      }
    }
    
    checkMonthStatus()
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
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }
    
    setEmployeeNumber(value)
    setError('')
    
    // Live search - show suggestions after 3 characters
    if (value.trim().length >= 3) {
      const matches = employeeCache.filter(emp => 
        emp.employeeNumber.toLowerCase().includes(value.trim().toLowerCase())
      )
      setFilteredEmployees(matches)
      setShowEmployeeSuggestions(matches.length > 0)
    } else {
      setShowEmployeeSuggestions(false)
      setFilteredEmployees([])
    }
    
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
      setShowEmployeeSuggestions(false)
      setFilteredEmployees([])
    }
  }

  // Select employee from suggestions
  const handleSelectEmployee = (employee: Employee) => {
    setEmployeeNumber(employee.employeeNumber)
    setEmployeeName(employee.employeeName)
    setDesignation(employee.designation || '')
    setJobWeight(employee.jobWeight)
    setShowEmployeeSuggestions(false)
    setFilteredEmployees([])
    // Focus on No of Days field
    setTimeout(() => noOfDaysRef.current?.focus(), 100)
  }
  
  // Handle Enter key on Employee Number field
  const handleEmployeeNumberKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = employeeNumber.trim()
      
      if (!value) {
        setError('Please enter an employee number')
        return
      }
      
      // First check cache
      let emp = employeeCache.find(e => e.employeeNumber === value)
      
      // If not in cache, fetch from API
      if (!emp) {
        try {
          emp = await employeeAPI.getByNumber(value)
          if (emp) {
            // Add to cache
            setEmployeeCache(prev => [...prev.filter(e => e.employeeNumber !== emp!.employeeNumber), emp!])
          }
        } catch (err) {
          emp = undefined
        }
      }
      
      if (emp) {
        setEmployeeName(emp.employeeName)
        setDesignation(emp.designation || '')
        setJobWeight(emp.jobWeight)
        setShowEmployeeSuggestions(false)
        setFilteredEmployees([])
        setError('')
        // Focus on No of Days field
        setTimeout(() => noOfDaysRef.current?.focus(), 100)
      } else {
        setError('Employee not found')
        setEmployeeName('')
        setDesignation('')
        setJobWeight('')
      }
    }
  }
  
  // Handle Enter key on No of Days field
  const handleNoOfDaysKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await handleSaveEmployeeDays()
      // Focus back on Employee Number field
      setTimeout(() => employeeNumberRef.current?.focus(), 100)
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

    // Check if employee already exists in the list for this month
    const existingEmployee = employeeDaysList.find(
      ed => ed.employeeNumber === employeeNumber.trim()
    )

    if (existingEmployee) {
      const confirmUpdate = confirm(
        `Employee ${employeeNumber.trim()} already has ${existingEmployee.noOfDays} days recorded for this month.\n\n` +
        `Do you want to update it to ${days} days?`
      )
      if (!confirmUpdate) {
        return
      }
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
      
      // Focus back on Employee Number field
      setTimeout(() => employeeNumberRef.current?.focus(), 100)
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
  
  // Handle Finish button - lock employee days for the month
  const handleFinishEmployeeDays = async () => {
    if (confirm('Are you sure you want to finish? Employee days for this month will be locked and cannot be edited.')) {
      try {
        setLoading(true)
        setError('')
        await monthlyReportsAPI.lockEmployeeDays(selectedMonth)
        setEmployeeDaysFinished(true)
        setShowProcessCalculations(true)
        await loadMonthlyReport()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
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
      let wsData
      if (user.role === 'Admin') {
        wsData = [
          ['S/N', 'NAME & DESIGNATION', 'EMPLOYEE NUMBER', 'Rs. (Old Rate)', 'Rs. (New Rate)'],
          ...oldRateResults.map((r, idx) => {
            const newRate = newRateResults[idx]
            const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
            const nameDesignation = employee?.designation 
              ? `${r.employeeName} (${employee.designation})`
              : r.employeeName
            return [
              idx + 1,
              nameDesignation,
              r.employeeNumber,
              r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
              newRate ? newRate.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''
            ]
          })
        ]
      } else {
        wsData = [
          ['S/N', 'NAME & DESIGNATION', 'EMPLOYEE NUMBER'],
          ...oldRateResults.map((r, idx) => {
            const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
            const nameDesignation = employee?.designation 
              ? `${r.employeeName} (${employee.designation})`
              : r.employeeName
            return [
              idx + 1,
              nameDesignation,
              r.employeeNumber
            ]
          })
        ]
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Both Rates')
    } else if (type === 'old') {
      let wsData
      if (user.role === 'Admin') {
        const oldRateConfig = rates.find(rate => rate.name === 'Old Rate')
        const code = oldRateConfig?.code || '95'
        const installments = oldRateConfig?.installments || '1'
        
        wsData = [
          ['S/N', 'EMPLOYEE NUMBER', 'NAME & DESIGNATION', 'Code', 'Rs.', 'Installments'],
          ...oldRateResults.map((r, index) => {
            const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
            const nameDesignation = employee?.designation 
              ? `${r.employeeName} (${employee.designation})`
              : r.employeeName
            return [
              index + 1,
              r.employeeNumber,
              nameDesignation,
              code,
              r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
              installments
            ]
          })
        ]
      } else {
        wsData = [
          ['S/N', 'EMPLOYEE NUMBER', 'NAME & DESIGNATION'],
          ...oldRateResults.map((r, index) => {
            const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
            const nameDesignation = employee?.designation 
              ? `${r.employeeName} (${employee.designation})`
              : r.employeeName
            return [
              index + 1,
              r.employeeNumber,
              nameDesignation
            ]
          })
        ]
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Old Rate')
    } else if (type === 'new') {
      let wsData
      if (user.role === 'Admin') {
        wsData = [
          ['S/N', 'EMPLOYEE NUMBER', 'NAME & DESIGNATION', 'Rs.'],
          ...newRateResults.map((r, index) => {
            const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
            const nameDesignation = employee?.designation 
              ? `${r.employeeName} (${employee.designation})`
              : r.employeeName
            return [
              index + 1,
              r.employeeNumber,
              nameDesignation,
              r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
            ]
          })
        ]
      } else {
        wsData = [
          ['S/N', 'EMPLOYEE NUMBER', 'NAME & DESIGNATION'],
          ...newRateResults.map((r, index) => {
            const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
            const nameDesignation = employee?.designation 
              ? `${r.employeeName} (${employee.designation})`
              : r.employeeName
            return [
              index + 1,
              r.employeeNumber,
              nameDesignation
            ]
          })
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
    
    // Add logo at top-right corner
    const logoImg = new Image()
    logoImg.src = logoImage
    doc.addImage(logoImg, 'PNG', 150, 10, 50, 10)
    
    // Get month name and year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
    const [year, month] = selectedMonth.split('-')
    const monthName = monthNames[parseInt(month) - 1]
    
    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`Executive Incentive Report – ${monthName} ${year}`, 14, 20)

    const tableData = employeeDaysList.map((ed, index) => {
      const employee = employeeCache.find(e => e.employeeNumber === ed.employeeNumber)
      const displayName = employee 
        ? employee.designation 
          ? `${employee.employeeName} (${employee.designation})`
          : employee.employeeName
        : ed.employeeName || 'Unknown'
      
      return [
        index + 1,
        ed.employeeNumber,
        displayName,
        employee?.jobWeight || '-',
        ed.noOfDays
      ]
    })

    autoTable(doc, {
      head: [['S/N', 'Employee Number', 'Employee Name & Designation', 'Job Weight', 'No of Days']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
    })

    // Add footer info below the table
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated by: ${user.username}`, 14, finalY)
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, finalY + 5)

    doc.save(`Executive_Incentive_Report_${monthName}_${year}.pdf`)
  }

  // Generate PDF for Admin (Old/New Rate Results)
  const generateAdminPDF = (type: 'old' | 'new') => {
    const doc = new jsPDF()
    const results = type === 'old' ? oldRateResults : newRateResults
    const total = results.reduce((sum, r) => sum + r.netAmount, 0)
    
    // Add logo at top-right corner
    const logoImg = new Image()
    logoImg.src = logoImage
    doc.addImage(logoImg, 'PNG', 150, 10, 50, 10)
    
    // Get month name and year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
    const [year, month] = selectedMonth.split('-')
    const monthName = monthNames[parseInt(month) - 1]
    
    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`Executive Incentive Report – ${monthName} ${year}`, 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`(${type === 'old' ? 'Old' : 'New'} Rate)`, 14, 26)

    const tableData = results.map((r, index) => {
      const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
      const displayName = employee 
        ? employee.designation 
          ? `${r.employeeName} (${employee.designation})`
          : r.employeeName
        : r.employeeName
      
      return [
        index + 1,
        r.employeeNumber,
        displayName,
        r.jobWeight,
        r.noOfDays,
        r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]
    })

    autoTable(doc, {
      head: [['S/N', 'Employee Number', 'Employee Name & Designation', 'Job Weight', 'No of Days', 'Net Amount (Rs.)']],
      body: tableData,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      foot: [['', '', '', '', 'Total:', total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})]],
      footStyles: { fillColor: [52, 152, 219], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Add footer info below the table
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated by: ${user.username}`, 14, finalY)
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, finalY + 5)

    doc.save(`Executive_Incentive_Report_${type === 'old' ? 'Old' : 'New'}_Rate_${monthName}_${year}.pdf`)
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
        
        // Finalize the month in database
        await monthlyReportsAPI.adminFinish({
          month: selectedMonth,
          gateMovement: parseFloat(parseFormattedNumber(gateMovement)),
          vesselAmount: parseFloat(parseFormattedNumber(vesselAmount))
        })
        
        // Save history records to database
        const historyRecords = oldRateResults.map((oldRate, index) => {
          const newRate = newRateResults[index]
          const employee = employeeCache.find(e => e.employeeNumber === oldRate.employeeNumber)
          
          return {
            employeeNumber: oldRate.employeeNumber,
            employeeName: oldRate.employeeName,
            designation: employee?.designation || null,
            jobWeight: oldRate.jobWeight.toString(),
            noOfDays: oldRate.noOfDays,
            oldRateAmount: oldRate.netAmount,
            newRateAmount: newRate ? newRate.netAmount : 0,
            month: selectedMonth
          }
        })
        
        await historyAPI.saveBulk(historyRecords)
        
        await loadMonthlyReport()
        
        // Save all process calculations data for display
        const savedDataKey = `monthData_${selectedMonth}`
        const dataToSave = {
          gateMovement,
          vesselAmount,
          oldRateResults,
          newRateResults,
          processDetails
        }
        localStorage.setItem(savedDataKey, JSON.stringify(dataToSave))
        
        alert('Month has been finalized successfully! History has been saved. You can now generate final Excel reports.')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Check if month is locked
  const isEmployeeDaysLocked = monthlyReport?.status === 'employee_days_locked' || monthlyReport?.status === 'admin_finished' || employeeDaysFinished
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
          <h2>Incentive Calculation</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="add-employee-btn" onClick={() => navigate('/add-employee')}>
              + Add New Employee
            </button>
            {user.role === 'Admin' && (
              <>
                <button 
                  className="add-employee-btn" 
                  onClick={() => navigate('/history')}
                  style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8' }}
                >
                  📊 View History
                </button>
                <button 
                  className="add-employee-btn" 
                  onClick={() => navigate('/operators')}
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                >
                  👥 Manage Operators
                </button>
              </>
            )}
            {user.role === 'Super Admin' && (
              <button 
                className="add-employee-btn" 
                onClick={() => navigate('/super-admin')}
                style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
              >
                ⚙️ Super Admin
              </button>
            )}
          </div>
        </div>

        {/* Month Selector */}
        <div className="form-section">
          <h3>Select Month</h3>
          {monthlyReport?.status === 'employee_days_locked' && (
            <div style={{ padding: '10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '10px' }}>
              ⚠️ This month has been locked by {monthlyReport?.employeeDaysLockedBy || 'Admin'}.
            </div>
          )}
          {monthlyReport?.status === 'admin_finished' && (
            <>
              {monthlyReport?.employeeDaysLockedBy && (
                <div style={{ padding: '10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '10px' }}>
                  ⚠️ Employee days were locked by {monthlyReport.employeeDaysLockedBy}.
                </div>
              )}
              <div style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', marginBottom: '10px' }}>
                ✓ This month has been finalized by {monthlyReport?.adminFinishedBy || 'Admin'}.
              </div>
            </>
          )}
          <div className="form-group">
            <label>Month:</label>
            <input
              type="month"
              value={selectedMonth}
              readOnly
              disabled
              className="form-input"
              style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>
              Month is automatically set to the previous month and cannot be changed.
            </small>
          </div>
        </div>

        {/* Add Employee Days */}
        <div className="form-section">
          <h3>Add Employee Days for {selectedMonth}</h3>
          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Employee Number:</label>
              <input
                ref={employeeNumberRef}
                type="text"
                value={employeeNumber}
                onChange={(e) => handleEmployeeNumberChange(e.target.value)}
                onKeyPress={handleEmployeeNumberKeyPress}
                placeholder="Enter employee number and press Enter"
                className="form-input"
                disabled={isEmployeeDaysLocked}
              />
              {/* Live Search Suggestions Dropdown */}
              {showEmployeeSuggestions && filteredEmployees.length > 0 && (
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
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.employeeNumber}
                      onClick={() => handleSelectEmployee(emp)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style={{ fontWeight: 'bold' }}>{emp.employeeNumber}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        {emp.employeeName} {emp.designation ? `(${emp.designation})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Employee Name:</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Auto-filled or enter manually"
                className={`form-input ${!employeeName ? 'autofilled' : ''}`}
                disabled={isEmployeeDaysLocked}
              />
            </div>
            <div className="form-group">
              <label>Designation:</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Auto-filled or enter manually"
                className={`form-input ${!designation ? 'autofilled' : ''}`}
                disabled={isEmployeeDaysLocked}
              />
            </div>
            <div className="form-group">
              <label>Job Weight:</label>
              <input
                type="text"
                value={jobWeight}
                readOnly
                placeholder="Auto-filled"
                className={`form-input readonly ${!jobWeight ? 'autofilled' : ''}`}
              />
            </div>
            <div className="form-group">
              <label>No of Days:</label>
              <input
                ref={noOfDaysRef}
                type="text"
                value={noOfDays}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setNoOfDays(value)
                }}
                onKeyPress={handleNoOfDaysKeyPress}
                placeholder="Enter days and press Enter"
                className="form-input"
                disabled={isEmployeeDaysLocked}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveEmployeeDays} className="btn-primary" disabled={loading || isEmployeeDaysLocked}>
                {loading ? 'Saving...' : 'Add'}
              </button>
              <button onClick={handleClearEmployeeDaysForm} className="btn-secondary" disabled={isEmployeeDaysLocked}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Employee Days Table */}
        <div className="table-section">
          <h3>Employee Days for {selectedMonth}</h3>
          
          {/* Search Box */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={searchEmployeeNumber}
              onChange={(e) => setSearchEmployeeNumber(e.target.value)}
              placeholder="🔍 Search by Employee Number..."
              className="form-input"
              style={{ maxWidth: '300px' }}
            />
          </div>
          
          {employeeDaysList.length === 0 ? (
            <p className="no-data">No employee days added for this month</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Employee Number</th>
                  <th>Employee Name & Designation</th>
                  <th>Job Weight</th>
                  <th>No of Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeeDaysList
                  .filter(ed => 
                    searchEmployeeNumber === '' || 
                    ed.employeeNumber.toLowerCase().includes(searchEmployeeNumber.toLowerCase())
                  )
                  .map((ed, index) => {
                  const employee = employeeCache.find(e => e.employeeNumber === ed.employeeNumber)
                  const displayName = employee 
                    ? employee.designation 
                      ? `${employee.employeeName} (${employee.designation})`
                      : employee.employeeName
                    : ed.employeeName || 'Unknown'
                  return (
                    <tr key={ed.id}>
                      <td>{index + 1}</td>
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
                                disabled={isEmployeeDaysLocked}
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
                                disabled={isEmployeeDaysLocked}
                              >
                                ✎
                              </button>
                              <button 
                                className="delete-action-btn"
                                onClick={() => handleDeleteEmployeeDays(ed.id)}
                                title="Delete"
                                disabled={isEmployeeDaysLocked}
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
          
          {/* PDF and Actions */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            {/* PDF Generation for Operator */}
            <button 
              onClick={generateOperatorPDF} 
              className="btn-secondary"
              disabled={employeeDaysList.length === 0}
            >
              📄 Generate PDF (Employee Days)
            </button>
            
            {/* Finish Button for Admin */}
            {user.role === 'Admin' && !employeeDaysFinished && employeeDaysList.length > 0 && (
              <button 
                onClick={handleFinishEmployeeDays} 
                className="btn-primary"
                style={{ minWidth: '200px' }}
              >
                ✓ Finish (Proceed to Process Calculations)
              </button>
            )}
          </div>
        </div>

        {/* Processing Section - Only visible to Admin after Finish */}
        {user.role === 'Admin' && showProcessCalculations && (
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
                disabled={isAdminFinished}
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
                disabled={isAdminFinished}
              />
            </div>
            <button onClick={handleProcess} className="btn-primary btn-large" disabled={loading || isAdminFinished}>
              {loading ? 'Processing...' : 'Process'}
            </button>
            <button onClick={() => { setGateMovement(''); setVesselAmount(''); setOldRateResults([]); setNewRateResults([]); setProcessDetails(null); }} className="btn-secondary" disabled={isAdminFinished}>
              Clear
            </button>
          </div>
        </div>

        {/* Results - Old Rate */}
        {oldRateResults.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h3>Old Rate Results {processDetails && `(Rate: ${processDetails.c})`}</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Employee Number</th>
                  <th>Employee Name & Designation</th>
                  <th>Job Weight</th>
                  <th>No of Days</th>
                  {user.role === 'Admin' && <th>Net Amount (Rs.)</th>}
                </tr>
              </thead>
              <tbody>
                {oldRateResults.map((r, idx) => {
                  const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
                  const displayName = employee?.designation 
                    ? `${r.employeeName} (${employee.designation})`
                    : r.employeeName
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{r.employeeNumber}</td>
                      <td>{displayName}</td>
                      <td>{r.jobWeight}</td>
                      <td>{r.noOfDays}</td>
                      {user.role === 'Admin' && <td>Rs. {r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                    </tr>
                  )
                })}
                <tr className="total-row">
                  <td colSpan={user.role === 'Admin' ? 5 : 5} style={{textAlign: 'right', fontWeight: 'bold'}}>Total Net Amount:</td>
                  <td style={{fontWeight: 'bold'}}>
                    Rs. {oldRateResults.reduce((sum, r) => sum + r.netAmount, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{marginTop: '10px', textAlign: 'center'}}>
              <button onClick={() => generateAdminPDF('old')} className="btn-primary">
                Generate PDF
              </button>
            </div>
          </div>
        )}

        {/* Results - New Rate */}
        {newRateResults.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h3>New Rate Results {processDetails && `(Rate: ${processDetails.d})`}</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Employee Number</th>
                  <th>Employee Name & Designation</th>
                  <th>Job Weight</th>
                  <th>No of Days</th>
                  {user.role === 'Admin' && <th>Net Amount (Rs.)</th>}
                </tr>
              </thead>
              <tbody>
                {newRateResults.map((r, idx) => {
                  const employee = employeeCache.find(e => e.employeeNumber === r.employeeNumber)
                  const displayName = employee?.designation 
                    ? `${r.employeeName} (${employee.designation})`
                    : r.employeeName
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{r.employeeNumber}</td>
                      <td>{displayName}</td>
                      <td>{r.jobWeight}</td>
                      <td>{r.noOfDays}</td>
                      {user.role === 'Admin' && <td>Rs. {r.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>}
                    </tr>
                  )
                })}
                <tr className="total-row">
                  <td colSpan={user.role === 'Admin' ? 5 : 5} style={{textAlign: 'right', fontWeight: 'bold'}}>Total Net Amount:</td>
                  <td style={{fontWeight: 'bold'}}>
                    Rs. {newRateResults.reduce((sum, r) => sum + r.netAmount, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{marginTop: '10px', textAlign: 'center'}}>
              <button onClick={() => generateAdminPDF('new')} className="btn-primary">
                Generate PDF
              </button>
            </div>
          </div>
        )}

      
        {/* Admin Actions - PDF and Finish */}
        {(oldRateResults.length > 0 || newRateResults.length > 0) && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
         
            
            {!isAdminFinished && (
              <button 
                onClick={handleAdminFinish} 
                className="btn-primary"
                disabled={loading}
                style={{ 
                  minWidth: '200px', 
                  backgroundColor: '#dc3545', 
                  borderColor: '#dc3545' 
                }}
              >
                ✓ Finalize Month
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
                 Final Excel (Old Rate)
              </button>
              <button onClick={() => exportToExcel('new')} className="btn-success">
                 Final Excel (New Rate)
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
