// API Service for Incentive Calculation System
const API_BASE_URL = 'http://localhost:3001/api';

// Employee API
export const employeeAPI = {
  // Get all employees
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  // Get employee by number
  getByNumber: async (employeeNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/employees/number/${employeeNumber}`);
    if (!response.ok) return null;
    return response.json();
  },

  // Get employee by name
  getByName: async (employeeName: string) => {
    const response = await fetch(`${API_BASE_URL}/employees/name/${employeeName}`);
    if (!response.ok) return null;
    return response.json();
  },

  // Create employee
  create: async (data: { employeeNumber: string; employeeName: string; designation?: string; jobWeight: string }) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create employee');
    }
    return response.json();
  },

  // Update employee job weight
  updateJobWeight: async (id: number, jobWeight: string) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobWeight }),
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  },

  // Update employee designation
  updateDesignation: async (id: number, designation: string) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designation }),
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  },

  // Update employee (both jobWeight and designation)
  update: async (id: number, data: { jobWeight?: string; designation?: string }) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  },

  // Delete employee
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  },
};

// Employee Days API
export const employeeDaysAPI = {
  // Get employee days for a specific month
  getByMonth: async (month: string) => {
    const response = await fetch(`${API_BASE_URL}/employee-days?month=${month}`);
    if (!response.ok) throw new Error('Failed to fetch employee days');
    return response.json();
  },

  // Add or update employee days
  save: async (data: { employeeNumber: string; noOfDays: number; month: string }) => {
    const response = await fetch(`${API_BASE_URL}/employee-days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save employee days');
    }
    return response.json();
  },

  // Delete employee days record
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/employee-days/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete employee days');
    return response.json();
  },
};

// Process API
export const processAPI = {
  // Process calculations for a specific month
  process: async (data: { gateMovement: number | string; vesselAmount: number | string; month: string; recordedBy?: string }) => {
    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to process calculations')
    }
    return response.json()
  }
};

// Monthly Reports API
export const monthlyReportsAPI = {
  // Get monthly report status
  getByMonth: async (month: string) => {
    const response = await fetch(`${API_BASE_URL}/monthly-reports?month=${month}`);
    if (!response.ok) throw new Error('Failed to fetch monthly report');
    return response.json();
  },

  // Operator finish
  operatorFinish: async (month: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monthly-reports/operator-finish`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ month }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to finish operator task');
    }
    return response.json();
  },

  // Admin finish
  adminFinish: async (data: { month: string; gateMovement: number | string; vesselAmount: number | string }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monthly-reports/admin-finish`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to finish admin task');
    }
    return response.json();
  },

  // Override (unlock month)
  override: async (month: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monthly-reports/override`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ month }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to override');
    }
    return response.json();
  },
};


