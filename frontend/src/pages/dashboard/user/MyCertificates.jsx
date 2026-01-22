import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiSearch, 
  HiDocumentText,
  HiCheckCircle,
  HiClock,
  HiEye,
  HiQrcode,
  HiRefresh,
  HiDownload,
  HiX,
  HiExternalLink
} from 'react-icons/hi';
import api from '../../../services/api';

const MyCertificates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const result = await api.getCertificates();
      if (result.success) {
        setCertificates(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const stats = [
    { label: 'Total', value: certificates.length, color: 'text-white' },
  ];

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDownload = async (cert) => {
    try {
      // If there's a preview URL (WYSIWYG created document), download the image
      if (cert.previewUrl) {
        // Fetch the image and create a blob for proper download
        const response = await fetch(cert.previewUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cert.title || cert.certificateId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (cert.filePath || cert.accessKey) {
        // Download the original uploaded file
        const downloadUrl = api.getDownloadUrl(cert.certificateId, cert.accessKey);
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Get extension from content-type or default to pdf
        const contentType = response.headers.get('content-type');
        let ext = 'pdf';
        if (contentType?.includes('image')) ext = contentType.split('/')[1] || 'png';
        else if (contentType?.includes('text')) ext = 'txt';
        link.download = `${cert.title || cert.certificateId}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // No file available, show message
        alert('No downloadable file available for this document');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const openPreview = (cert) => {
    setPreviewModal(cert);
  };

  const openQrModal = (cert) => {
    setQrModal(cert);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Documents</h1>
          <p className="text-gray-400">View and download your documents</p>
        </div>
        <button onClick={fetchCertificates} className="btn-secondary">
          <HiRefresh className="w-5 h-5 mr-2 inline" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-dark-100/50 rounded-xl border border-white/10 p-4"
          >
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or certificate ID..."
            className="input-field-dark pl-12 w-full"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading documents...</p>
        </div>
      ) : (
        /* Documents List */
        <div className="space-y-4">
          {filteredCertificates.map((cert, index) => (
            <motion.div
              key={cert._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-100/50 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Preview Thumbnail */}
                <div 
                  className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                    flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => openPreview(cert)}
                >
                  {cert.previewUrl ? (
                    <img 
                      src={cert.previewUrl} 
                      alt={cert.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <HiDocumentText className="w-10 h-10 text-primary-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold truncate">{cert.title}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-600/20 text-accent-400">
                      Stored
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm font-mono">{cert.certificateId}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Created: {new Date(cert.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  {/* Preview Button */}
                  <button 
                    onClick={() => openPreview(cert)}
                    className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white 
                      hover:bg-white/10 transition-all" 
                    title="Preview"
                  >
                    <HiEye className="w-5 h-5" />
                  </button>

                  {/* QR Code Button */}
                  <button 
                    onClick={() => openQrModal(cert)}
                    className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white 
                      hover:bg-white/10 transition-all" 
                    title="View QR Code"
                  >
                    <HiQrcode className="w-5 h-5" />
                  </button>

                  {/* Download Button */}
                  <button 
                    onClick={() => handleDownload(cert)}
                    className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-green-400 
                      hover:bg-green-500/10 transition-all" 
                    title="Download"
                  >
                    <HiDownload className="w-5 h-5" />
                  </button>

                  {/* View Details */}
                  <Link
                    to={`/dashboard/certificates/${cert.certificateId}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600/20 
                      text-primary-400 hover:bg-primary-600/30 transition-all text-sm font-medium"
                  >
                    <HiExternalLink className="w-4 h-4" />
                    Details
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-gray-500">Hash:</span>
                  <code className="font-mono text-xs">{cert.documentHash?.slice(0, 32)}...</code>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredCertificates.length === 0 && (
            <div className="text-center py-12">
              <HiDocumentText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No documents found</h3>
              <p className="text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'Upload your first document to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-200 rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h3 className="text-white font-semibold">{previewModal.title}</h3>
                  <p className="text-gray-400 text-sm font-mono">{previewModal.certificateId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewModal)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                      transition-colors flex items-center gap-2"
                  >
                    <HiDownload className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setPreviewModal(null)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-auto max-h-[calc(90vh-100px)] flex items-center justify-center bg-gray-900/50">
                {previewModal.previewUrl ? (
                  <img 
                    src={previewModal.previewUrl} 
                    alt={previewModal.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="text-center py-20">
                    <HiDocumentText className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Preview not available</p>
                    <p className="text-gray-500 text-sm mt-2">
                      This document was uploaded without a preview image
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setQrModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-200 rounded-2xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Verification QR Code</h3>
                <button
                  onClick={() => setQrModal(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              {qrModal.qrCode ? (
                <div className="bg-white rounded-xl p-4 inline-block mb-4">
                  <img 
                    src={qrModal.qrCode} 
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl p-8 mb-4">
                  <HiQrcode className="w-24 h-24 text-gray-600 mx-auto" />
                  <p className="text-gray-400 mt-2">QR code not available</p>
                </div>
              )}

              <p className="text-gray-400 text-sm mb-4">
                Scan this code to verify the document
              </p>

              <div className="bg-dark-100 rounded-lg p-3 text-left">
                <p className="text-gray-500 text-xs">Document ID</p>
                <p className="text-white font-mono text-sm">{qrModal.certificateId}</p>
              </div>

              <div className="mt-4">
                <a
                  href={`/verify/${qrModal.certificateId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white 
                    rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <HiExternalLink className="w-4 h-4" />
                  Open Verification Page
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCertificates;
