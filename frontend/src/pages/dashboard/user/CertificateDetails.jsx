import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HiArrowLeft,
  HiDocumentText,
  HiCheckCircle,
  HiQrcode,
  HiKey,
  HiDownload,
  HiClipboard,
  HiRefresh
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const CertificateDetails = () => {
  const { id } = useParams();
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    setLoading(true);
    const result = await api.getCertificate(id);
    if (result.success) {
      setCertificate(result.data);
    } else {
      toast.error('Failed to load certificate');
    }
    setLoading(false);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadQRCode = () => {
    if (!certificate?.qrCode) return;
    const link = document.createElement('a');
    link.href = certificate.qrCode;
    link.download = `${certificate.certificateId}-qr.png`;
    link.click();
    toast.success('QR Code downloaded!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <HiDocumentText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">Certificate not found</h3>
          <p className="text-gray-400 mb-4">The certificate you're looking for doesn't exist.</p>
          <Link to="/dashboard/certificates" className="btn-primary">
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/dashboard/certificates" 
          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <HiArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Certificate Details</h1>
          <p className="text-gray-400">View your certificate information</p>
        </div>
        <button onClick={fetchCertificate} className="btn-secondary">
          <HiRefresh className="w-5 h-5 mr-2 inline" />
          Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Certificate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary-600/20 to-accent-600/20 p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
                    flex items-center justify-center">
                    <HiDocumentText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{certificate.title}</h2>
                    <p className="text-gray-400 font-mono text-sm">{certificate.certificateId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-600/20">
                  <HiCheckCircle className="w-4 h-4 text-accent-500" />
                  <span className="text-accent-400 text-sm font-medium">Stored</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-500 text-sm">Certificate ID</label>
                  <p className="text-white font-mono">{certificate.certificateId}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">Created Date</label>
                  <p className="text-white font-medium">
                    {new Date(certificate.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">File Name</label>
                  <p className="text-white font-medium">{certificate.fileName}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">File Size</label>
                  <p className="text-white font-medium">
                    {(certificate.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Document Hash */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
          >
            <h3 className="text-white font-semibold mb-4">Document Hash (SHA-256)</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-primary-400 text-sm font-mono bg-dark-200/50 rounded-lg p-4 break-all">
                {certificate.documentHash}
              </code>
              <button
                onClick={() => copyToClipboard(certificate.documentHash, 'Hash')}
                className="p-3 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg"
              >
                <HiClipboard className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              This unique hash represents your document's fingerprint. Any modification to the document will result in a different hash.
            </p>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <HiQrcode className="w-5 h-5 text-primary-400" />
              <h3 className="text-white font-semibold">Verification QR Code</h3>
            </div>

            {certificate.qrCode && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <img 
                  src={certificate.qrCode} 
                  alt="QR Code" 
                  className="w-full h-auto"
                />
              </div>
            )}

            <p className="text-gray-400 text-sm text-center mb-4">
              Scan to verify authenticity
            </p>

            <button 
              onClick={downloadQRCode}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl 
              bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-all"
            >
              <HiDownload className="w-4 h-4" />
              Download QR Code
            </button>
          </motion.div>

          {/* Access Key */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <HiKey className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Access Key</h3>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Required to verify the full certificate
            </p>

            <div className="bg-dark-200/50 rounded-xl p-3 mb-4">
              <code className={`text-sm font-mono ${showAccessKey ? 'text-yellow-400' : 'text-gray-500'}`}>
                {showAccessKey ? certificate.accessKey : '••••••••••••••••'}
              </code>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAccessKey(!showAccessKey)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 
                  border border-white/10 text-sm transition-all"
              >
                {showAccessKey ? 'Hide' : 'Reveal'}
              </button>
              <button
                onClick={() => copyToClipboard(certificate.accessKey, 'Access key')}
                className="flex-1 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 
                  border border-white/10 text-sm transition-all"
              >
                Copy
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetails;
