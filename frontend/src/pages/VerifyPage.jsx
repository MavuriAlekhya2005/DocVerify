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
  HiInformationCircle,
  HiUser,
  HiCalendar,
  HiOfficeBuilding,
  HiAcademicCap,
  HiClipboardCheck
} from 'react-icons/hi';
import Logo from '../components/Logo';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';

const VerifyPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [accessLevel, setAccessLevel] = useState('partial');

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Call the real API for verification
        const result = await api.verify(id);
        
        if (result.success && result.status === 'valid') {
          setVerificationData(result);
          setAccessLevel(result.accessLevel || 'partial');
          setCertificate({
            id: result.data.certificateId,
            status: 'verified',
            title: result.data.title,
            recipient: result.data.verificationSummary?.holderName || 'Not detected',
            issuer: result.data.verificationSummary?.issuingAuthority || 'Not detected',
            issueDate: result.data.verificationSummary?.issueDate || result.data.createdAt,
            expiryDate: result.data.verificationSummary?.validUntil,
            hash: result.data.documentHash,
            documentType: result.data.verificationSummary?.documentType || result.data.primaryDetails?.documentType || 'general',
            aiScore: result.data.verificationSummary?.confidenceScore || result.data.primaryDetails?.confidenceScore || 0,
            documentNumber: result.data.verificationSummary?.documentNumber || 'Not detected',
            qualification: result.data.verificationSummary?.qualification,
            grade: result.data.verificationSummary?.grade,
            integrityHash: result.data.verificationSummary?.integrityHash || result.data.primaryDetails?.hash,
            extractionStatus: result.data.extractionStatus,
            verificationCount: result.data.verificationCount,
            primaryDetails: result.data.primaryDetails,
            fullDetails: result.data.fullDetails,
            fileInfo: result.data.fileInfo,
            accessStats: result.data.accessStats,
            qrCode: result.data.qrCode,
          });
        } else {
          setCertificate(null);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Failed to verify certificate');
        setCertificate(null);
      }
      setIsLoading(false);
    };

    fetchCertificate();
  }, [id]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!accessKey) {
      toast.error('Please enter an access key');
      return;
    }
    
    try {
      // Call API with access key for full access
      const result = await api.verify(id, accessKey);
      
      if (result.success && result.accessLevel === 'full') {
        setVerificationData(result);
        setAccessLevel('full');
        setIsUnlocked(true);
        setShowAccessKeyModal(false);
        
        // Update certificate with full details
        setCertificate(prev => ({
          ...prev,
          primaryDetails: result.data.primaryDetails,
          fullDetails: result.data.fullDetails,
          fileInfo: result.data.fileInfo,
          accessStats: result.data.accessStats,
          qrCode: result.data.qrCode,
        }));
        
        toast.success('Full certificate access granted!');
      } else {
        toast.error('Invalid access key');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error('Failed to unlock certificate');
    }
  };

  const handleDownload = async () => {
    if (!isUnlocked || !accessKey) {
      toast.error('Please unlock the certificate first');
      return;
    }
    
    try {
      const downloadUrl = `http://localhost:5000/api/download/${id}?accessKey=${accessKey}`;
      window.open(downloadUrl, '_blank');
      toast.success('Download started!');
    } catch (error) {
      toast.error('Failed to download document');
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
                  <HiDocumentText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{certificate.title}</h2>
                  <p className="text-gray-400">
                    {certificate.documentType !== 'general' ? (
                      <span className="capitalize">{certificate.documentType} Document</span>
                    ) : 'Document Certificate'}
                  </p>
                </div>
              </div>

              {/* Primary Extracted Details - Always Visible */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HiUser className="w-4 h-4 text-primary-400" />
                    <p className="text-gray-500 text-xs">Holder Name</p>
                  </div>
                  <p className="text-white font-medium">{certificate.recipient}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HiClipboardCheck className="w-4 h-4 text-accent-400" />
                    <p className="text-gray-500 text-xs">Document Number</p>
                  </div>
                  <p className="text-white font-medium">{certificate.documentNumber}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HiOfficeBuilding className="w-4 h-4 text-yellow-400" />
                    <p className="text-gray-500 text-xs">Issuing Authority</p>
                  </div>
                  <p className="text-white font-medium">{certificate.issuer}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HiCalendar className="w-4 h-4 text-green-400" />
                    <p className="text-gray-500 text-xs">Issue Date</p>
                  </div>
                  <p className="text-white font-medium">
                    {certificate.issueDate && certificate.issueDate !== 'Not detected' 
                      ? (certificate.issueDate.includes('T') 
                          ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : certificate.issueDate)
                      : 'Not detected'}
                  </p>
                </div>
                {certificate.qualification && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <HiAcademicCap className="w-4 h-4 text-purple-400" />
                      <p className="text-gray-500 text-xs">Qualification</p>
                    </div>
                    <p className="text-white font-medium">{certificate.qualification}</p>
                  </div>
                )}
                {certificate.grade && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <HiShieldCheck className="w-4 h-4 text-pink-400" />
                      <p className="text-gray-500 text-xs">Grade/Result</p>
                    </div>
                    <p className="text-white font-medium">{certificate.grade}</p>
                  </div>
                )}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Certificate ID</p>
                  <p className="text-white font-mono text-sm">{certificate.id}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Valid Until</p>
                  <p className="text-white font-medium">
                    {certificate.expiryDate && certificate.expiryDate !== 'Not specified' 
                      ? certificate.expiryDate 
                      : 'No Expiry'}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Extraction & Verification Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiShieldCheck className="w-5 h-5 text-accent-500" />
                    <span className="text-gray-300">AI Extraction Confidence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          certificate.aiScore >= 70 
                            ? 'bg-gradient-to-r from-accent-500 to-accent-400' 
                            : certificate.aiScore >= 40 
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${certificate.aiScore}%` }}
                      ></div>
                    </div>
                    <span className={`font-medium ${
                      certificate.aiScore >= 70 ? 'text-accent-400' : 
                      certificate.aiScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{certificate.aiScore}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiCube className="w-5 h-5 text-primary-400" />
                    <span className="text-gray-300">Extraction Status</span>
                  </div>
                  <span className={`font-medium capitalize ${
                    certificate.extractionStatus === 'completed' ? 'text-accent-400' : 
                    certificate.extractionStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {certificate.extractionStatus || 'Unknown'} 
                    {certificate.extractionStatus === 'completed' && ' ✓'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <HiDocumentText className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Document Type</span>
                  </div>
                  <span className="text-yellow-400 font-medium capitalize">{certificate.documentType}</span>
                </div>
                {certificate.verificationCount && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <HiCheckCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Times Verified</span>
                    </div>
                    <span className="text-blue-400 font-medium">{certificate.verificationCount}</span>
                  </div>
                )}
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
                    <h3 className="text-white font-semibold mb-2">Full Details Locked</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Enter access key to view complete extracted data & download document
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
                  <h3 className="text-lg font-semibold text-white mb-4">Full Extracted Details</h3>
                  <p className="text-gray-400">Complete document data, structured fields, signatures, and download access...</p>
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
                  <h3 className="text-lg font-semibold text-white">Full Extracted Details</h3>
                  <span className="px-2 py-0.5 bg-accent-600/20 text-accent-400 text-xs rounded-full">Full Access</span>
                </div>
                
                {/* All Primary Fields */}
                {certificate.primaryDetails?.fields && Object.keys(certificate.primaryDetails.fields).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">All Extracted Fields</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(certificate.primaryDetails.fields).map(([key, value]) => (
                        value && (
                          <div key={key} className="bg-white/5 rounded-xl p-3">
                            <p className="text-gray-500 text-xs mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-white font-medium text-sm">{value}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Details - Structured Data */}
                {certificate.fullDetails?.structuredData && Object.keys(certificate.fullDetails.structuredData).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Structured Data</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(certificate.fullDetails.structuredData).map(([key, value]) => (
                        <div key={key} className="bg-white/5 rounded-xl p-3">
                          <p className="text-gray-500 text-xs mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-white font-medium text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates Found */}
                {certificate.fullDetails?.dates && certificate.fullDetails.dates.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Dates Found in Document</h4>
                    <div className="flex flex-wrap gap-2">
                      {certificate.fullDetails.dates.map((date, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm">
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatures */}
                {certificate.fullDetails?.signatures && certificate.fullDetails.signatures.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Signatures/Authorizations</h4>
                    <div className="flex flex-wrap gap-2">
                      {certificate.fullDetails.signatures.map((sig, idx) => (
                        <span key={idx} className="px-3 py-1 bg-accent-600/20 text-accent-400 rounded-full text-sm">
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Stats */}
                {certificate.fullDetails && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Document Statistics</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{certificate.fullDetails.wordCount || 0}</p>
                        <p className="text-gray-500 text-xs">Words</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{certificate.fullDetails.lineCount || 0}</p>
                        <p className="text-gray-500 text-xs">Lines</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{certificate.fullDetails.extractionMetadata?.pages || 1}</p>
                        <p className="text-gray-500 text-xs">Pages</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Info & Download */}
                {certificate.fileInfo && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Original Document</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{certificate.fileInfo.originalFilename}</p>
                        <p className="text-gray-500 text-sm">
                          {certificate.fileInfo.fileType} • {(certificate.fileInfo.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {certificate.fileInfo.downloadAvailable && (
                        <button 
                          onClick={handleDownload}
                          className="btn-primary"
                        >
                          <HiDownload className="w-5 h-5 mr-2 inline" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Access Statistics */}
                {certificate.accessStats && (
                  <div className="p-4 bg-primary-600/10 rounded-xl border border-primary-500/20">
                    <h4 className="text-sm font-medium text-primary-400 mb-3">Access Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xl font-bold text-white">{certificate.accessStats.verificationCount}</p>
                        <p className="text-gray-500 text-xs">Verifications</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{certificate.accessStats.fullAccessCount}</p>
                        <p className="text-gray-500 text-xs">Full Access</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white">{certificate.accessStats.downloadCount}</p>
                        <p className="text-gray-500 text-xs">Downloads</p>
                      </div>
                    </div>
                  </div>
                )}
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
                {isUnlocked && certificate.qrCode ? (
                  <img src={certificate.qrCode} alt="Certificate QR" className="w-40 h-40" />
                ) : (
                  <QRCode value={window.location.href} size={160} />
                )}
              </div>
              <p className="text-gray-500 text-xs text-center mt-4">
                {isUnlocked ? 'Original certificate QR code' : 'Scan to verify this certificate'}
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
                {!isUnlocked && (
                  <button 
                    onClick={() => setShowAccessKeyModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 text-gray-300 
                      hover:bg-white/10 transition-colors text-left"
                  >
                    <HiKey className="w-5 h-5" />
                    <span>Unlock Full Details</span>
                  </button>
                )}
                {isUnlocked && certificate.fileInfo?.downloadAvailable && (
                  <button 
                    onClick={handleDownload}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 text-gray-300 
                      hover:bg-white/10 transition-colors text-left"
                  >
                    <HiDownload className="w-5 h-5" />
                    <span>Download Document</span>
                  </button>
                )}
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
