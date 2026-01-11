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

  // Lock Employee Days (Stage 1)
  lockEmployeeDays: async (month: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monthly-reports/lock-employee-days`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ month }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to lock employee days');
    }
    return response.json();
  },

  // Admin finish (Stage 2)
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
};

// Designations API
export const designationsAPI = {
  // Get all designations from XML
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/designations`);
    if (!response.ok) throw new Error('Failed to fetch designations');
    return response.json();
  },
};

// Rates API
export const ratesAPI = {
  // Get all rates from XML
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/rates`);
    if (!response.ok) throw new Error('Failed to fetch rates');
    return response.json();
  },
  
  // Get specific rate by name
  getByName: async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/rates/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error('Failed to fetch rate');
    return response.json();
  },
};

// History API
export const historyAPI = {
  // Search history by month and/or employee number
  search: async (params: { month?: string; employeeNumber?: string }) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.month) queryParams.append('month', params.month);
    if (params.employeeNumber) queryParams.append('employeeNumber', params.employeeNumber);
    
    const response = await fetch(`${API_BASE_URL}/history/search?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to search history');
    return response.json();
  },
  
  // Get all history with pagination
  getAll: async (page: number = 1, limit: number = 100) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/history?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },
  
  // Save history records (bulk)
  saveBulk: async (records: any[]) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/history/bulk`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ records }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save history');
    }
    return response.json();
  },
  
  // Delete history by month
  deleteByMonth: async (month: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/history/month/${month}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete history');
    }
    return response.json();
  },
};

// Users API (Super Admin only)
export const usersAPI = {
  // Get all users
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // Create Admin user
  createAdmin: async (data: { username: string; password: string }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/create-admin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create admin user');
    }
    return response.json();
  },

  // Toggle user active status
  toggleActive: async (userId: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-active`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user status');
    }
    return response.json();
  },

  // Reset user password
  resetPassword: async (userId: number, newPassword: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }
    return response.json();
  },

  // Delete user
  deleteUser: async (userId: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  },
};

// Super Admin API
export const superAdminAPI = {
  // Reprocess month - unlock and delete data
  reprocessMonth: async (month: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monthly-reports/reprocess`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ month }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reprocess month');
    }
    return response.json();
  },
};

// Operators API (Admin only)
export const operatorsAPI = {
  // Get all operators
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/operators`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch operators');
    return response.json();
  },

  // Create Operator user
  create: async (data: { username: string; password: string }) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/create-operator`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create operator user');
    }
    return response.json();
  },

  // Toggle operator active status
  toggleActive: async (operatorId: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/operators/${operatorId}/toggle-active`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update operator status');
    }
    return response.json();
  },

  // Reset operator password
  resetPassword: async (operatorId: number, newPassword: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/operators/${operatorId}/reset-password`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }
    return response.json();
  },

  // Delete operator
  deleteOperator: async (operatorId: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/operators/${operatorId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete operator');
    }
    return response.json();
  },
};


