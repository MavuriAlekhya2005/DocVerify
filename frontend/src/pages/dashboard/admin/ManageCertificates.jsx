import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HiSearch, 
  HiFilter, 
  HiDocumentText,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
  HiEye,
  HiTrash,
  HiDownload,
  HiDotsVertical,
  HiRefresh
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const ManageCertificates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCerts, setSelectedCerts] = useState([]);
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

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.verificationSummary?.holderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || cert.extractionStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-accent-600/20 text-accent-400',
      pending: 'bg-yellow-600/20 text-yellow-400',
      processing: 'bg-blue-600/20 text-blue-400',
      failed: 'bg-red-600/20 text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || styles.pending}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const toggleSelect = (id) => {
    setSelectedCerts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCerts.length === filteredCertificates.length) {
      setSelectedCerts([]);
    } else {
      setSelectedCerts(filteredCertificates.map(c => c.certificateId));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCerts.length} certificate(s)?`)) {
      return;
    }
    
    try {
      for (const certId of selectedCerts) {
        await api.deleteCertificate(certId);
      }
      toast.success(`${selectedCerts.length} certificate(s) deleted`);
      setSelectedCerts([]);
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to delete certificates');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manage Documents</h1>
          <p className="text-gray-400">View, search, and manage all issued documents</p>
        </div>
        <button onClick={fetchCertificates} className="btn-secondary">
          <HiRefresh className="w-5 h-5 mr-2 inline" />
          Refresh
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, title, or ID..."
            className="input-field-dark pl-12 w-full"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'pending', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-4 mb-6 flex items-center justify-between"
        >
          <span className="text-primary-400">
            {selectedCerts.length} certificate(s) selected
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedCerts([])}
              className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm hover:bg-white/20"
            >
              Clear Selection
            </button>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 flex items-center gap-2"
            >
              <HiTrash className="w-4 h-4" />
              Delete
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCerts.length === filteredCertificates.length && filteredCertificates.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-600"
                  />
                </th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">ID</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Holder</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Title</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Type</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Created</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert, index) => (
                <motion.tr
                  key={cert._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCerts.includes(cert.certificateId)}
                      onChange={() => toggleSelect(cert.certificateId)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-600"
                    />
                  </td>
                  <td className="px-4 py-4 text-white font-mono text-sm">{cert.certificateId}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-white text-sm">{cert.verificationSummary?.holderName || 'Unknown'}</p>
                      <p className="text-gray-500 text-xs">{cert.primaryDetails?.documentType || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300 text-sm max-w-[200px] truncate">{cert.title}</td>
                  <td className="px-4 py-4 text-gray-400 text-sm capitalize">{cert.primaryDetails?.documentType || 'general'}</td>
                  <td className="px-4 py-4 text-gray-400 text-sm">
                    {new Date(cert.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(cert.extractionStatus)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/dashboard/certificates/${cert.certificateId}`}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                      >
                        <HiEye className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Delete this certificate?')) {
                            await api.deleteCertificate(cert.certificateId);
                            toast.success('Certificate deleted');
                            fetchCertificates();
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-12">
            <HiDocumentText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No certificates found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Info */}
        <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManageCertificates;
