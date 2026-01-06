import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HiSearch, 
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiEye,
  HiDownload,
  HiCalendar,
  HiRefresh
} from 'react-icons/hi';
import api from '../../../services/api';

const VerificationHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const result = await api.getCertificates();
      if (result.success) {
        // Filter to only show certificates that have been verified
        const verified = result.data.filter(c => c.verificationCount > 0);
        setCertificates(verified);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const stats = {
    total: certificates.length,
    totalVerifications: certificates.reduce((sum, c) => sum + (c.verificationCount || 0), 0),
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.verificationSummary?.holderName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification History</h1>
          <p className="text-gray-400">View documents that have been verified</p>
        </div>
        <button onClick={fetchCertificates} className="btn-secondary">
          <HiRefresh className="w-5 h-5 mr-2 inline" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-100/50 rounded-xl border border-white/10 p-4 text-center"
        >
          <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
          <div className="text-gray-400 text-sm">Verified Documents</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-100/50 rounded-xl border border-white/10 p-4 text-center"
        >
          <div className="text-3xl font-bold text-accent-400 mb-1">{stats.totalVerifications}</div>
          <div className="text-gray-400 text-sm">Total Verifications</div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, holder..."
            className="input-field-dark pl-12 w-full"
          />
        </div>
      </div>

      {/* History List */}
      <div className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-12">
              <HiCheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No verified documents yet</h3>
              <p className="text-gray-400">Documents that have been verified will appear here</p>
            </div>
          ) : (
            filteredCertificates.map((cert, index) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <HiCheckCircle className="w-5 h-5 text-accent-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-white font-medium truncate">{cert.title}</h3>
                        <p className="text-gray-400 text-sm">{cert.verificationSummary?.holderName || 'Unknown holder'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 bg-accent-600/20 text-accent-400">
                        {cert.verificationCount} verification{cert.verificationCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                      <span className="text-gray-500">ID: <span className="text-gray-400 font-mono">{cert.certificateId}</span></span>
                      <span className="text-gray-500">Last verified: <span className="text-gray-400">{formatDate(cert.lastVerifiedAt)}</span></span>
                    </div>
                  </div>
                  <Link
                    to={`/verifier/${cert.certificateId}`}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <HiEye className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationHistory;