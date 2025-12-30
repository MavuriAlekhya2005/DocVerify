import { useState } from 'react';
import { motion } from 'framer-motion';
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

const ManageCertificates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCerts, setSelectedCerts] = useState([]);

  // Mock data
  const certificates = [
    {
      id: 'CERT-001',
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      title: 'Bachelor of Computer Science',
      type: 'degree',
      issueDate: '2024-05-15',
      status: 'verified',
      hash: '0x7f83b165...9069',
    },
    {
      id: 'CERT-002',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      title: 'AWS Solutions Architect',
      type: 'certification',
      issueDate: '2024-03-20',
      status: 'verified',
      hash: '0x8a92b165...9069',
    },
    {
      id: 'CERT-003',
      recipientName: 'Bob Wilson',
      recipientEmail: 'bob@example.com',
      title: 'Machine Learning Specialization',
      type: 'course',
      issueDate: '2024-01-10',
      status: 'pending',
      hash: '',
    },
    {
      id: 'CERT-004',
      recipientName: 'Alice Johnson',
      recipientEmail: 'alice@example.com',
      title: 'Experience Certificate',
      type: 'experience',
      issueDate: '2023-12-01',
      status: 'verified',
      hash: '0x9b03b165...9069',
    },
    {
      id: 'CERT-005',
      recipientName: 'Charlie Brown',
      recipientEmail: 'charlie@example.com',
      title: 'Python Developer',
      type: 'certification',
      issueDate: '2023-08-15',
      status: 'revoked',
      hash: '0xab12c165...9069',
    },
  ];

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || cert.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      verified: 'bg-accent-600/20 text-accent-400',
      pending: 'bg-yellow-600/20 text-yellow-400',
      revoked: 'bg-red-600/20 text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
      setSelectedCerts(filteredCertificates.map(c => c.id));
    }
  };

  const handleRevoke = () => {
    toast.success(`${selectedCerts.length} certificate(s) revoked`);
    setSelectedCerts([]);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Manage Certificates</h1>
        <p className="text-gray-400">View, search, and manage all issued certificates</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, title, or ID..."
            className="input-field-dark pl-12 w-full"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'verified', 'pending', 'revoked'].map((f) => (
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
            <button className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm hover:bg-white/20 flex items-center gap-2">
              <HiDownload className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={handleRevoke}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 flex items-center gap-2"
            >
              <HiTrash className="w-4 h-4" />
              Revoke
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
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Recipient</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Title</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Type</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Issue Date</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-4 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert, index) => (
                <motion.tr
                  key={cert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCerts.includes(cert.id)}
                      onChange={() => toggleSelect(cert.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-600"
                    />
                  </td>
                  <td className="px-4 py-4 text-white font-mono text-sm">{cert.id}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-white text-sm">{cert.recipientName}</p>
                      <p className="text-gray-500 text-xs">{cert.recipientEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-300 text-sm max-w-[200px] truncate">{cert.title}</td>
                  <td className="px-4 py-4 text-gray-400 text-sm capitalize">{cert.type}</td>
                  <td className="px-4 py-4 text-gray-400 text-sm">
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(cert.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <HiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <HiDownload className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <HiDotsVertical className="w-4 h-4" />
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

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm">1</button>
            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10">2</button>
            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10">3</button>
            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCertificates;
