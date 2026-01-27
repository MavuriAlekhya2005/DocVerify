// Use environment variable for API URL with fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Account management
const MAX_ACCOUNTS = 5;
const ACTIVE_ACCOUNT_KEY = 'activeAccountId';

// Get all stored accounts
const getStoredAccounts = () => {
  const accounts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('account_')) {
      const accountId = key.replace('account_', '');
      try {
        const accountData = JSON.parse(localStorage.getItem(key));
        accounts.push({ id: accountId, ...accountData });
      } catch (e) {
        // Invalid data, skip
      }
    }
  }
  return accounts;
};

// Get active account
const getActiveAccount = () => {
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (!activeId) return null;
  
  const accountKey = `account_${activeId}`;
  const accountData = localStorage.getItem(accountKey);
  return accountData ? JSON.parse(accountData) : null;
};

// Set active account
const setActiveAccount = (accountId) => {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
};

// Update last activity for specific account
const updateLastActivity = (accountId) => {
  const accountKey = `account_${accountId}`;
  const accountData = localStorage.getItem(accountKey);
  if (accountData) {
    const account = JSON.parse(accountData);
    account.lastActivity = Date.now();
    localStorage.setItem(accountKey, JSON.stringify(account));
  }
};

// Check if account session has expired
const isAccountSessionExpired = (account) => {
  if (!account || !account.lastActivity) return true;
  const timeSinceLastActivity = Date.now() - account.lastActivity;
  return timeSinceLastActivity > SESSION_TIMEOUT;
};

// Clear specific account session
const clearAccountSession = (accountId) => {
  localStorage.removeItem(`account_${accountId}`);
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (activeId === accountId) {
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  }
};

// Clear all sessions
const clearAllSessions = () => {
  const accounts = getStoredAccounts();
  accounts.forEach(account => {
    localStorage.removeItem(`account_${account.id}`);
  });
  localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const activeAccount = getActiveAccount();
  if (!activeAccount || isAccountSessionExpired(activeAccount)) {
    if (activeAccount) {
      clearAccountSession(activeAccount.id);
    }
    return {};
  }
  
  if (activeAccount.token) {
    updateLastActivity(activeAccount.id); // Update activity on each authenticated request
  }
  return activeAccount.token ? { 'Authorization': `Bearer ${activeAccount.token}` } : {};
};

// Helper for handling API responses with better error handling
const handleResponse = async (response) => {
  if (!response.ok) {
    // Handle specific HTTP errors
    if (response.status === 401) {
      clearSession();
      // Could trigger a redirect to login here if needed
    }
    // Try to get error message from response
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `HTTP Error: ${response.status}`,
      status: response.status,
    };
  }
  return response.json();
};

// Helper for wrapping fetch with network error handling
const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return handleResponse(response);
  } catch (error) {
    // Network errors (offline, CORS, etc.)
    console.error('Network error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      isNetworkError: true,
    };
  }
};

export const api = {
  // ==================== SESSION MANAGEMENT ====================
  
  // Check and handle session timeout
  checkSession: () => {
    const activeAccount = getActiveAccount();
    if (!activeAccount || isAccountSessionExpired(activeAccount)) {
      if (activeAccount) {
        clearAccountSession(activeAccount.id);
      }
      return false;
    }
    updateLastActivity(activeAccount.id);
    return true;
  },
  
  // Get time remaining in session (in seconds)
  getSessionTimeRemaining: () => {
    const activeAccount = getActiveAccount();
    if (!activeAccount || !activeAccount.lastActivity) return SESSION_TIMEOUT / 1000;
    
    const timeSinceLastActivity = Date.now() - activeAccount.lastActivity;
    const remaining = Math.max(0, SESSION_TIMEOUT - timeSinceLastActivity);
    return Math.floor(remaining / 1000);
  },
  
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
      const accountId = data.data.user.id || data.data.user.email;
      const accountData = {
        id: accountId,
        token: data.data.token,
        user: data.data.user,
        lastActivity: Date.now()
      };
      
      // Check if we already have this account
      const existingAccounts = getStoredAccounts();
      const existingAccount = existingAccounts.find(acc => acc.user.email === data.data.user.email);
      
      if (existingAccount) {
        // Update existing account
        localStorage.setItem(`account_${existingAccount.id}`, JSON.stringify(accountData));
        setActiveAccount(existingAccount.id);
      } else if (existingAccounts.length < MAX_ACCOUNTS) {
        // Add new account
        localStorage.setItem(`account_${accountId}`, JSON.stringify(accountData));
        setActiveAccount(accountId);
      } else {
        // Max accounts reached, replace oldest
        const oldestAccount = existingAccounts.sort((a, b) => a.lastActivity - b.lastActivity)[0];
        localStorage.setItem(`account_${oldestAccount.id}`, JSON.stringify(accountData));
        setActiveAccount(oldestAccount.id);
      }
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
      const accountId = data.data.user.id || data.data.user.email;
      const accountData = {
        id: accountId,
        token: data.data.token,
        user: data.data.user,
        lastActivity: Date.now()
      };
      
      // Check if we already have this account
      const existingAccounts = getStoredAccounts();
      const existingAccount = existingAccounts.find(acc => acc.user.email === data.data.user.email);
      
      if (existingAccount) {
        // Update existing account
        localStorage.setItem(`account_${existingAccount.id}`, JSON.stringify(accountData));
        setActiveAccount(existingAccount.id);
      } else if (existingAccounts.length < MAX_ACCOUNTS) {
        // Add new account
        localStorage.setItem(`account_${accountId}`, JSON.stringify(accountData));
        setActiveAccount(accountId);
      } else {
        // Max accounts reached, replace oldest
        const oldestAccount = existingAccounts.sort((a, b) => a.lastActivity - b.lastActivity)[0];
        localStorage.setItem(`account_${oldestAccount.id}`, JSON.stringify(accountData));
        setActiveAccount(oldestAccount.id);
      }
    }
    return data;
  },

  // Logout current account
  logout: () => {
    const activeAccount = getActiveAccount();
    if (activeAccount) {
      clearAccountSession(activeAccount.id);
    }
  },

  // Logout all accounts
  logoutAll: () => {
    clearAllSessions();
  },

  // Get current user
  getCurrentUser: () => {
    const activeAccount = getActiveAccount();
    if (!activeAccount || isAccountSessionExpired(activeAccount)) {
      if (activeAccount) {
        clearAccountSession(activeAccount.id);
      }
      return null;
    }
    return activeAccount.user;
  },

  // Check if user is logged in
  isAuthenticated: () => {
    const activeAccount = getActiveAccount();
    return !!(activeAccount && !isAccountSessionExpired(activeAccount));
  },

  // Get all stored accounts
  getStoredAccounts: () => {
    return getStoredAccounts().filter(account => !isAccountSessionExpired(account));
  },

  // Switch to different account
  switchAccount: (accountId) => {
    const accounts = getStoredAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    if (account && !isAccountSessionExpired(account)) {
      setActiveAccount(accountId);
      return true;
    }
    return false;
  },

  // Remove account
  removeAccount: (accountId) => {
    clearAccountSession(accountId);
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

  // Save WYSIWYG document (any user)
  saveWYSIWYGDocument: async (data) => {
    const response = await fetch(`${API_URL}/documents/wysiwyg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
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

  // ==================== WYSIWYG DOCUMENTS ====================

  // Create document from WYSIWYG editor
  createWYSIWYGDocument: async (data) => {
    const response = await fetch(`${API_URL}/documents/wysiwyg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update WYSIWYG document
  updateWYSIWYGDocument: async (documentId, data) => {
    const response = await fetch(`${API_URL}/documents/wysiwyg/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Get WYSIWYG document for editing
  getWYSIWYGDocument: async (documentId) => {
    const response = await fetch(`${API_URL}/documents/wysiwyg/${documentId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== BLOCKCHAIN ====================

  // Get blockchain status
  getBlockchainStatus: async () => {
    const response = await fetch(`${API_URL}/blockchain/status`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Verify document on blockchain
  verifyOnBlockchain: async (documentId) => {
    const response = await fetch(`${API_URL}/blockchain/verify/${documentId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Get blockchain transaction details
  getBlockchainTransaction: async (documentId) => {
    const response = await fetch(`${API_URL}/blockchain/transaction/${documentId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== AI SERVICES ====================

  // Extract fields from document using AI
  aiExtract: async (text, documentType = null, filePath = null) => {
    const response = await fetch(`${API_URL}/ai/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ text, documentType, filePath }),
    });
    return response.json();
  },

  // Get AI suggestions for field value
  aiSuggest: async (fieldName, partialValue, context = {}) => {
    const response = await fetch(`${API_URL}/ai/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ fieldName, partialValue, context }),
    });
    return response.json();
  },

  // Validate and enhance extracted data
  aiValidate: async (fields, documentType) => {
    const response = await fetch(`${API_URL}/ai/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ fields, documentType }),
    });
    return response.json();
  },

  // Get supported document types
  getDocumentTypes: async () => {
    const response = await fetch(`${API_URL}/ai/document-types`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Get recommended fields for document type
  getRecommendedFields: async (documentType) => {
    const response = await fetch(`${API_URL}/ai/fields/${documentType}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Generate document summary
  generateSummary: async (text, documentType) => {
    const response = await fetch(`${API_URL}/ai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ text, documentType }),
    });
    return response.json();
  },

  // Get AI service status
  getAIStatus: async () => {
    const response = await fetch(`${API_URL}/ai/status`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== GAS ESTIMATION ====================

  // Get current gas prices
  getGasPrices: async () => {
    const response = await fetch(`${API_URL}/blockchain/gas/prices`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Estimate gas for operation
  estimateGas: async (operation, params = {}) => {
    const response = await fetch(`${API_URL}/blockchain/gas/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ operation, ...params }),
    });
    return response.json();
  },

  // Get wallet balance
  getWalletBalance: async () => {
    const response = await fetch(`${API_URL}/blockchain/wallet`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== ANALYTICS ====================

  // Get detailed analytics (admin)
  getDetailedAnalytics: async () => {
    const response = await fetch(`${API_URL}/analytics/detailed`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Get realtime analytics (admin)
  getRealtimeAnalytics: async () => {
    const response = await fetch(`${API_URL}/analytics/realtime`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // ==================== CACHE ====================

  // Get cache stats (admin)
  getCacheStats: async () => {
    const response = await fetch(`${API_URL}/cache/stats`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  // Invalidate cache entry (admin)
  invalidateCache: async (type, id) => {
    const response = await fetch(`${API_URL}/cache/invalidate/${type}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

export default api;
