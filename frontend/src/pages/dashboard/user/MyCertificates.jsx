import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HiSearch, 
  HiDocumentText,
  HiCheckCircle,
  HiClock,
  HiEye,
  HiQrcode,
  HiRefresh
} from 'react-icons/hi';
import api from '../../../services/api';

const MyCertificates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Documents</h1>
          <p className="text-gray-400">View your uploaded documents</p>
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
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                    flex items-center justify-center">
                    <HiDocumentText className="w-7 h-7 text-primary-400" />
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
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white 
                    hover:bg-white/10 transition-all" title="View QR Code">
                    <HiQrcode className="w-5 h-5" />
                  </button>
                  <Link
                    to={`/dashboard/certificates/${cert.certificateId}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600/20 
                      text-primary-400 hover:bg-primary-600/30 transition-all text-sm font-medium"
                  >
                    <HiEye className="w-4 h-4" />
                    View Details
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
    </div>
  );
};

export default MyCertificates;
