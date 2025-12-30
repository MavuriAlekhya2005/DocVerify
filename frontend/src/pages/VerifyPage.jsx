import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiShieldCheck,
  HiCube,
  HiDocumentText,
  HiKey,
  HiLockClosed,
  HiExternalLink,
  HiDownload,
  HiShare,
  HiInformationCircle
} from 'react-icons/hi';
import Logo from '../components/Logo';
import toast, { Toaster } from 'react-hot-toast';

const VerifyPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);

  useEffect(() => {
    // Simulate fetching certificate data
    const fetchCertificate = async () => {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      
      // Mock certificate data
      if (id) {
        setCertificate({
          id: id,
          status: 'verified',
          title: 'Bachelor of Computer Science',
          recipient: 'John Doe',
          issuer: 'Stanford University',
          issuerLogo: null,
          issueDate: '2024-05-15',
          expiryDate: null,
          hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          blockNumber: 18234567,
          transactionHash: '0x1234...abcd',
          aiScore: 98.7,
          merkleRoot: '0xabc...123',
          description: 'This certificate is awarded to John Doe for successfully completing the Bachelor of Computer Science program with honors.',
          metadata: {
            gpa: '3.85',
            major: 'Computer Science',
            minor: 'Mathematics',
            honors: 'Cum Laude',
          },
        });
      } else {
        setCertificate(null);
      }
      setIsLoading(false);
    };

    fetchCertificate();
  }, [id]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (accessKey === 'demo123' || accessKey.length >= 6) {
      setIsUnlocked(true);
      setShowAccessKeyModal(false);
      toast.success('Full certificate access granted!');
    } else {
      toast.error('Invalid access key');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Verification link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-600/20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Verifying Certificate</h2>
          <p className="text-gray-400">Checking blockchain records...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-dark-200 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-600/20 flex items-center justify-center">
            <HiXCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Certificate Not Found</h1>
          <p className="text-gray-400 mb-8">
            The certificate you're looking for doesn't exist or the link may be invalid.
          </p>
          <Link to="/" className="btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-200">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-dark-100 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 
                border border-white/10 hover:bg-white/10 transition-all text-sm"
            >
              <HiShare className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Verification Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 mb-8 ${
            certificate.status === 'verified' 
              ? 'bg-accent-600/10 border border-accent-500/30' 
              : 'bg-red-600/10 border border-red-500/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              certificate.status === 'verified' ? 'bg-accent-600/20' : 'bg-red-600/20'
            }`}>
              {certificate.status === 'verified' 
                ? <HiCheckCircle className="w-10 h-10 text-accent-500" />
                : <HiXCircle className="w-10 h-10 text-red-500" />
              }
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {certificate.status === 'verified' ? 'Certificate Verified!' : 'Verification Failed'}
              </h1>
              <p className="text-gray-400">
                {certificate.status === 'verified' 
                  ? 'This certificate is authentic and recorded on the blockchain'
                  : 'This certificate could not be verified'
                }
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Certificate Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Certificate Card */}
            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 
                  flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  SU
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{certificate.title}</h2>
                  <p className="text-gray-400">Issued by {certificate.issuer}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Recipient</p>
                  <p className="text-white font-medium">{certificate.recipient}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Issue Date</p>
                  <p className="text-white font-medium">
                    {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Certificate ID</p>
                  <p className="text-white font-mono text-sm">{certificate.id}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Expiry</p>
                  <p className="text-white font-medium">
                    {certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 'No Expiry'}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Verification Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiShieldCheck className="w-5 h-5 text-accent-500" />
                    <span className="text-gray-300">AI Authenticity Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
                        style={{ width: `${certificate.aiScore}%` }}
                      ></div>
                    </div>
                    <span className="text-accent-400 font-medium">{certificate.aiScore}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiCube className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-300">Blockchain Block</span>
                  </div>
                  <span className="text-primary-400 font-medium">#{certificate.blockNumber}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiDocumentText className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Merkle Proof</span>
                  </div>
                  <span className="text-yellow-400 font-medium">Verified ✓</span>
                </div>
              </div>
            </div>

            {/* Document Hash */}
            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Document Hash</h3>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-2">SHA-256 Hash</p>
                <code className="text-white text-sm font-mono break-all">{certificate.hash}</code>
              </div>
            </div>

            {/* Locked Content */}
            {!isUnlocked && (
              <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-dark-100/80 flex items-center justify-center z-10">
                  <div className="text-center p-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                      <HiLockClosed className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Protected Content</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Enter the access key to view full certificate details
                    </p>
                    <button 
                      onClick={() => setShowAccessKeyModal(true)}
                      className="btn-primary"
                    >
                      <HiKey className="w-5 h-5 mr-2 inline" />
                      Enter Access Key
                    </button>
                  </div>
                </div>
                <div className="opacity-50 blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Additional Details</h3>
                  <p className="text-gray-400">{certificate.description}</p>
                </div>
              </div>
            )}

            {isUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-100/50 rounded-2xl border border-white/10 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-white">Full Certificate Details</h3>
                  <span className="px-2 py-0.5 bg-accent-600/20 text-accent-400 text-xs rounded-full">Unlocked</span>
                </div>
                <p className="text-gray-400 mb-6">{certificate.description}</p>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {Object.entries(certificate.metadata).map(([key, value]) => (
                    <div key={key} className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-500 text-xs mb-1 capitalize">{key.replace('_', ' ')}</p>
                      <p className="text-white font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <button className="btn-primary w-full sm:w-auto">
                  <HiDownload className="w-5 h-5 mr-2 inline" />
                  Download Full Certificate
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* QR Code */}
            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Verification QR</h3>
              <div className="bg-white p-4 rounded-xl mx-auto w-fit">
                <QRCode value={window.location.href} size={160} />
              </div>
              <p className="text-gray-500 text-xs text-center mt-4">
                Scan to verify this certificate
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 text-gray-300 
                    hover:bg-white/10 transition-colors text-left"
                >
                  <HiShare className="w-5 h-5" />
                  <span>Share Verification Link</span>
                </button>
                <a 
                  href={`https://etherscan.io/tx/${certificate.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 text-gray-300 
                    hover:bg-white/10 transition-colors"
                >
                  <HiExternalLink className="w-5 h-5" />
                  <span>View on Etherscan</span>
                </a>
                <button 
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 text-gray-300 
                    hover:bg-white/10 transition-colors text-left"
                >
                  <HiDownload className="w-5 h-5" />
                  <span>Download Proof</span>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-primary-600/10 rounded-2xl border border-primary-500/20 p-6">
              <div className="flex items-start gap-3">
                <HiInformationCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">How verification works</h4>
                  <p className="text-gray-400 text-sm">
                    We verify certificates by checking the document hash against our blockchain records 
                    and running AI-powered forgery detection.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Access Key Modal */}
      <AnimatePresence>
        {showAccessKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAccessKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-100 rounded-2xl border border-white/10 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-600/20 flex items-center justify-center">
                  <HiKey className="w-7 h-7 text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Enter Access Key</h2>
                <p className="text-gray-400 text-sm">
                  The access key was provided by the certificate holder or issuer
                </p>
              </div>
              
              <form onSubmit={handleUnlock}>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter access key..."
                  className="input-field-dark mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAccessKeyModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Verified by <span className="text-primary-400">DocVerify</span> • 
            Blockchain-powered certificate verification with AI forgery detection
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VerifyPage;
