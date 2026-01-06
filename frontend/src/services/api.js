const API_URL = 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // ==================== OTP ====================

  // Send OTP to email
  sendOTP: async (email, purpose = 'registration') => {
    const response = await fetch(`${API_URL}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose }),
    });
    return response.json();
  },

  // Verify OTP
  verifyOTP: async (email, otp, purpose = 'registration') => {
    const response = await fetch(`${API_URL}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, purpose }),
    });
    return response.json();
  },

  // Reset password with verified OTP
  resetPassword: async (email, otp, newPassword) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    return response.json();
  },

  // ==================== AUTH ====================
  
  // Register new user
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (data.success && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.success && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get user from server
  getMe: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== DOCUMENTS ====================

  // Upload document
  upload: async (file, title = '') => {
    const formData = new FormData();
    formData.append('document', file);
    if (title) formData.append('title', title);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    return response.json();
  },

  // Get all documents
  getCertificates: async () => {
    const response = await fetch(`${API_URL}/certificates`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Get single document
  getCertificate: async (id) => {
    const response = await fetch(`${API_URL}/certificates/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Verify document (tiered access)
  verify: async (certificateId, accessKey = '') => {
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ certificateId, accessKey }),
    });
    return response.json();
  },

  // Quick verify (primary details only)
  quickVerify: async (certificateId) => {
    const response = await fetch(`${API_URL}/verify/quick/${certificateId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Download document (requires access key)
  getDownloadUrl: (certificateId, accessKey) => {
    return `${API_URL}/download/${certificateId}?accessKey=${accessKey}`;
  },

  // Health check
  health: async () => {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },

  // ==================== ADMIN ====================

  // Get dashboard statistics
  getStats: async () => {
    const response = await fetch(`${API_URL}/stats`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Issue a new certificate (admin)
  issueCertificate: async (data) => {
    const response = await fetch(`${API_URL}/certificates/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Issue document (any user)
  issueUserDocument: async (data) => {
    const response = await fetch(`${API_URL}/documents/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Bulk issue documents (any user)
  bulkIssueDocuments: async (documents) => {
    const response = await fetch(`${API_URL}/documents/bulk-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ documents }),
    });
    return response.json();
  },

  // Get user's issued documents
  getIssuedDocuments: async () => {
    const response = await fetch(`${API_URL}/documents/issued`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Delete/revoke a certificate
  deleteCertificate: async (certificateId) => {
    const response = await fetch(`${API_URL}/certificates/${certificateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== USERS MANAGEMENT (ADMIN) ====================

  // Get all users
  getUsers: async () => {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ role }),
    });
    return response.json();
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== PROFILE SETTINGS ====================

  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Change password
  changePassword: async (data) => {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Disconnect OAuth provider
  disconnectOAuth: async (provider) => {
    const response = await fetch(`${API_URL}/auth/disconnect/${provider}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

export default api;
