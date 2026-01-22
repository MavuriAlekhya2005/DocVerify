/**
 * Public Verification Page
 * Allows anyone to verify a document by ID or QR code
 */
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiSearch, 
  HiDocumentText,
  HiShieldCheck,
  HiClock,
  HiUser,
  HiCalendar,
  HiFingerPrint,
  HiExternalLink,
  HiArrowLeft
} from 'react-icons/hi';
import api from '../services/api';
import Logo from '../components/Logo';

const VerifyPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const accessKey = searchParams.get('key');
  
  const [documentId, setDocumentId] = useState(id || '');
  const [accessKeyInput, setAccessKeyInput] = useState(accessKey || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-verify if ID is in URL
  useEffect(() => {
    if (id) {
      handleVerify();
    }
  }, [id]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    
    if (!documentId.trim()) {
      setError('Please enter a document ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.verify(documentId.trim(), accessKeyInput.trim() || undefined);
      
      if (response.success) {
        setResult({
          isValid: true,
          certificate: response.data,
          blockchainVerified: response.blockchainVerified
        });
      } else {
        setError(response.message || 'Document not found or invalid');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setDocumentId('');
    setAccessKeyInput('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-300">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-200/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xl font-bold text-white">DocVerify</span>
          </Link>
          <Link 
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 mb-6">
            <HiShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Document Verification</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Verify the authenticity of any document issued through DocVerify. 
            Enter the document ID below to check its validity.
          </p>
        </motion.div>

        {/* Verification Form */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-100/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-8"
          >
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Document ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <HiFingerPrint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="Enter document ID (e.g., DOC-ABC12345)"
                    className="w-full bg-dark-200 border border-white/10 rounded-xl py-4 pl-12 pr-4 
                      text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 
                      focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Key <span className="text-gray-500">(optional - for full details)</span>
                </label>
                <input
                  type="text"
                  value={accessKeyInput}
                  onChange={(e) => setAccessKeyInput(e.target.value)}
                  placeholder="Enter access key if you have one"
                  className="w-full bg-dark-200 border border-white/10 rounded-xl py-4 px-4 
                    text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 
                    focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
                >
                  <HiXCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <HiSearch className="w-5 h-5" />
                    Verify Document
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Verification Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className={`p-8 rounded-2xl border ${
              result.isValid 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                {result.isValid ? (
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <HiCheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <HiXCircle className="w-10 h-10 text-red-400" />
                  </div>
                )}
                <div>
                  <h2 className={`text-2xl font-bold ${result.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.isValid ? 'Document Verified' : 'Verification Failed'}
                  </h2>
                  <p className="text-gray-400">
                    {result.isValid 
                      ? 'This document is authentic and valid'
                      : 'This document could not be verified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Details */}
            {result.isValid && result.certificate && (
              <div className="bg-dark-100/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5 text-primary-400" />
                  Document Details
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500 text-sm">Document Title</p>
                      <p className="text-white font-medium">{result.certificate.title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Document ID</p>
                      <p className="text-white font-mono">{result.certificate.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Issued To</p>
                      <p className="text-white">{result.certificate.recipientName || result.certificate.recipientEmail || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500 text-sm">Issue Date</p>
                      <p className="text-white">
                        {result.certificate.createdAt 
                          ? new Date(result.certificate.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Document Hash</p>
                      <p className="text-white font-mono text-sm break-all">
                        {result.certificate.documentHash?.slice(0, 32)}...
                      </p>
                    </div>
                    {result.blockchainVerified && (
                      <div className="flex items-center gap-2 text-green-400">
                        <HiShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-medium">Blockchain Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview if available */}
                {result.certificate.previewUrl && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-gray-500 text-sm mb-4">Document Preview</p>
                    <img 
                      src={result.certificate.previewUrl} 
                      alt="Document Preview"
                      className="max-w-full rounded-xl border border-white/10"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={resetVerification}
                className="flex-1 btn-secondary py-3"
              >
                Verify Another Document
              </button>
              <Link
                to="/"
                className="flex-1 btn-primary py-3 text-center"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: HiShieldCheck,
              title: 'Secure Verification',
              description: 'All documents are verified against our blockchain-backed database'
            },
            {
              icon: HiClock,
              title: 'Instant Results',
              description: 'Get verification results in seconds with detailed document info'
            },
            {
              icon: HiFingerPrint,
              title: 'Tamper-Proof',
              description: 'Document hashes ensure the content has not been modified'
            }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-dark-100/30 rounded-xl border border-white/5">
              <item.icon className="w-8 h-8 text-primary-400 mb-3" />
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 DocVerify. All rights reserved. Powered by blockchain technology.
        </div>
      </footer>
    </div>
  );
};

export default VerifyPage;
