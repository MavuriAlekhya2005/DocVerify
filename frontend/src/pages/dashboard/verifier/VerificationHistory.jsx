import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiSearch, 
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiEye,
  HiDownload,
  HiCalendar
} from 'react-icons/hi';

const VerificationHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Mock data
  const verifications = [
    {
      id: '1',
      certificateId: 'DOC-A1B2C3D4',
      title: 'Bachelor of Computer Science',
      issuer: 'Stanford University',
      recipient: 'John Doe',
      verifiedAt: '2024-12-25T10:30:00Z',
      status: 'valid',
    },
    {
      id: '2',
      certificateId: 'DOC-E5F6G7H8',
      title: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      recipient: 'Jane Smith',
      verifiedAt: '2024-12-24T14:15:00Z',
      status: 'valid',
    },
    {
      id: '3',
      certificateId: 'DOC-I9J0K1L2',
      title: 'Unknown Certificate',
      issuer: 'Unknown',
      recipient: 'Unknown',
      verifiedAt: '2024-12-24T09:00:00Z',
      status: 'invalid',
    },
    {
      id: '4',
      certificateId: 'DOC-M3N4O5P6',
      title: 'Machine Learning Specialization',
      issuer: 'Coursera',
      recipient: 'Bob Wilson',
      verifiedAt: '2024-12-23T16:45:00Z',
      status: 'valid',
    },
    {
      id: '5',
      certificateId: 'DOC-Q7R8S9T0',
      title: 'Experience Certificate',
      issuer: 'Google Inc.',
      recipient: 'Alice Johnson',
      verifiedAt: '2024-12-22T11:20:00Z',
      status: 'valid',
    },
    {
      id: '6',
      certificateId: 'DOC-U1V2W3X4',
      title: 'Suspicious Document',
      issuer: 'Unknown Institution',
      recipient: 'Unknown',
      verifiedAt: '2024-12-21T08:30:00Z',
      status: 'invalid',
    },
  ];

  const stats = {
    total: verifications.length,
    valid: verifications.filter(v => v.status === 'valid').length,
    invalid: verifications.filter(v => v.status === 'invalid').length,
  };

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = 
      v.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusIcon = (status) => {
    return status === 'valid' 
      ? <HiCheckCircle className="w-5 h-5 text-accent-500" />
      : <HiXCircle className="w-5 h-5 text-red-500" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Verification History</h1>
        <p className="text-gray-400">View your past certificate verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-100/50 rounded-xl border border-white/10 p-4 text-center"
        >
          <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
          <div className="text-gray-400 text-sm">Total Verifications</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-100/50 rounded-xl border border-white/10 p-4 text-center"
        >
          <div className="text-3xl font-bold text-accent-400 mb-1">{stats.valid}</div>
          <div className="text-gray-400 text-sm">Valid Certificates</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-100/50 rounded-xl border border-white/10 p-4 text-center"
        >
          <div className="text-3xl font-bold text-red-400 mb-1">{stats.invalid}</div>
          <div className="text-gray-400 text-sm">Invalid/Failed</div>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, recipient..."
            className="input-field-dark pl-12 w-full"
          />
        </div>
        <div className="flex items-center gap-2 bg-dark-100/50 rounded-xl border border-white/10 px-4">
          <HiCalendar className="w-5 h-5 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent text-gray-300 py-2.5 outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredVerifications.map((verification, index) => (
            <motion.div
              key={verification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getStatusIcon(verification.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-white font-medium truncate">{verification.title}</h3>
                      <p className="text-gray-400 text-sm">{verification.issuer}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${
                      verification.status === 'valid' 
                        ? 'bg-accent-600/20 text-accent-400' 
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {verification.status === 'valid' ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                    <span className="text-gray-500">
                      ID: <span className="text-gray-400 font-mono">{verification.certificateId}</span>
                    </span>
                    <span className="text-gray-500">
                      Recipient: <span className="text-gray-400">{verification.recipient}</span>
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <HiClock className="w-4 h-4" />
                      {formatDate(verification.verifiedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <HiEye className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <HiDownload className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredVerifications.length === 0 && (
          <div className="text-center py-12">
            <HiSearch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No verifications found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 
          border border-white/10 hover:bg-white/10 transition-all">
          <HiDownload className="w-5 h-5" />
          Export History
        </button>
      </div>
    </div>
  );
};

export default VerificationHistory;
