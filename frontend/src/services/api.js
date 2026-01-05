const API_URL = 'http://localhost:5000/api';

export const api = {
  // Upload certificate
  upload: async (file, title = '') => {
    const formData = new FormData();
    formData.append('document', file);
    if (title) formData.append('title', title);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // Get all certificates
  getCertificates: async () => {
    const response = await fetch(`${API_URL}/certificates`);
    return response.json();
  },

  // Get single certificate
  getCertificate: async (id) => {
    const response = await fetch(`${API_URL}/certificates/${id}`);
    return response.json();
  },

  // Verify certificate (tiered access)
  verify: async (certificateId, accessKey = '') => {
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateId, accessKey }),
    });
    return response.json();
  },

  // Quick verify (primary details only)
  quickVerify: async (certificateId) => {
    const response = await fetch(`${API_URL}/verify/quick/${certificateId}`);
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
};

export default api;
