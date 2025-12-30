import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  HiQrcode, 
  HiCamera,
  HiSearch,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiCube,
  HiKey,
  HiRefresh,
  HiUpload,
  HiPhotograph
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const ScanVerify = () => {
  const [mode, setMode] = useState('scan'); // 'scan', 'upload', 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const verifyCertificate = async (certId, key = '') => {
    setIsVerifying(true);
    
    try {
      const result = await api.verify(certId, key);
      
      if (result.success && result.status === 'valid') {
        setVerificationResult({
          status: 'valid',
          certificate: result.data,
        });
      } else {
        setVerificationResult({
          status: 'invalid',
          reason: result.message || 'Certificate not found',
        });
      }
    } catch (error) {
      setVerificationResult({
        status: 'invalid',
        reason: 'Verification failed. Please try again.',
      });
    }
    
    setIsVerifying(false);
  };

  // QR Image Upload Handler
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsVerifying(true);
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      const result = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();
      
      // Parse QR data
      try {
        const qrData = JSON.parse(result);
        if (qrData.certificateId) {
          await verifyCertificate(qrData.certificateId, qrData.accessKey || '');
        } else {
          await verifyCertificate(result, '');
        }
      } catch {
        await verifyCertificate(result, '');
      }
    } catch (error) {
      toast.error('Could not read QR code from image');
      setIsVerifying(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const startScanning = async () => {
    setIsScanning(true);
    try {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
    } catch (err) {
      toast.error('Unable to access camera');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
      setIsScanning(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanning();
    
    try {
      const qrData = JSON.parse(decodedText);
      if (qrData.certificateId) {
        await verifyCertificate(qrData.certificateId, qrData.accessKey || '');
      } else {
        await verifyCertificate(decodedText, '');
      }
    } catch {
      await verifyCertificate(decodedText, '');
    }
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!manualId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }
    await verifyCertificate(manualId, accessKey);
  };

  const reset = () => {
    setVerificationResult(null);
    setManualId('');
    setAccessKey('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Verify Certificate</h1>
        <p className="text-gray-400">Scan QR code, upload QR image, or enter certificate ID</p>
      </div>

      <AnimatePresence mode="wait">
        {!verificationResult && !isVerifying ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('scan'); stopScanning(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  mode === 'scan'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                <HiCamera className="w-5 h-5" />
                Camera
              </button>
              <button
                onClick={() => { setMode('upload'); stopScanning(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  mode === 'upload'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                <HiUpload className="w-5 h-5" />
                Upload QR
              </button>
              <button
                onClick={() => { setMode('manual'); stopScanning(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                <HiSearch className="w-5 h-5" />
                Manual
              </button>
            </div>

            {mode === 'scan' ? (
              <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                    flex items-center justify-center">
                    <HiQrcode className="w-8 h-8 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">QR Code Scanner</h2>
                  <p className="text-gray-400">Position the certificate QR code within the frame</p>
                </div>

                <div className="relative max-w-sm mx-auto mb-6">
                  <div 
                    id="qr-reader" 
                    ref={scannerRef}
                    className={`aspect-square rounded-xl overflow-hidden bg-dark-200 ${isScanning ? '' : 'hidden'}`}
                  ></div>
                  
                  {!isScanning && (
                    <div className="aspect-square rounded-xl bg-dark-200 border-2 border-dashed border-white/20 
                      flex flex-col items-center justify-center">
                      <HiCamera className="w-16 h-16 text-gray-600 mb-4" />
                      <p className="text-gray-500">Camera preview will appear here</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  {!isScanning ? (
                    <button onClick={startScanning} className="btn-primary">
                      <HiCamera className="w-5 h-5 mr-2 inline" />
                      Start Scanning
                    </button>
                  ) : (
                    <button onClick={stopScanning} className="btn-secondary">
                      Stop Scanning
                    </button>
                  )}
                </div>
              </div>
            ) : mode === 'upload' ? (
              <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                    flex items-center justify-center">
                    <HiPhotograph className="w-8 h-8 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Upload QR Code Image</h2>
                  <p className="text-gray-400">Upload a screenshot or photo of the QR code</p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                    ${isDragActive 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-white/20 hover:border-primary-500/50'
                    }`}
                >
                  <input {...getInputProps()} />
                  <HiUpload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-white">Drop the image here...</p>
                  ) : (
                    <>
                      <p className="text-white mb-2">Drag & drop QR code image here</p>
                      <p className="text-gray-500 text-sm">or click to browse</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                    flex items-center justify-center">
                    <HiSearch className="w-8 h-8 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Manual Verification</h2>
                  <p className="text-gray-400">Enter the certificate ID and access key</p>
                </div>

                <form onSubmit={handleManualVerify} className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Certificate ID *
                    </label>
                    <input
                      type="text"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      placeholder="e.g., DOC-A1B2C3D4"
                      className="input-field-dark"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Access Key (for full access)
                    </label>
                    <div className="relative">
                      <HiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="Optional"
                        className="input-field-dark pl-12"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      Without access key, only basic info will be shown
                    </p>
                  </div>
                  <button type="submit" className="w-full btn-primary">
                    Verify Certificate
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        ) : isVerifying ? (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-600/20 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verifying Certificate</h2>
            <p className="text-gray-400">Checking database records...</p>
          </motion.div>
        ) : verificationResult.status === 'valid' ? (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-accent-600/10 border border-accent-500/30 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent-600/20 flex items-center justify-center flex-shrink-0">
                <HiCheckCircle className="w-10 h-10 text-accent-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Certificate Verified!</h2>
                <p className="text-gray-400">This certificate is authentic and on record</p>
              </div>
            </div>

            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Certificate Details</h3>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Certificate ID</p>
                  <p className="text-white font-mono">{verificationResult.certificate.certificateId}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Title</p>
                  <p className="text-white font-medium">{verificationResult.certificate.title}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 sm:col-span-2">
                  <p className="text-gray-500 text-xs mb-1">Document Hash (SHA-256)</p>
                  <p className="text-white font-mono text-sm break-all">{verificationResult.certificate.documentHash}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Created At</p>
                  <p className="text-white">
                    {new Date(verificationResult.certificate.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {verificationResult.certificate.fullAccess && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-gray-500 text-xs mb-1">Access Level</p>
                    <p className="text-accent-400 font-medium">Full Access ✓</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <HiCube className="w-5 h-5 text-primary-400" />
                  <span className="text-gray-300">Document Integrity</span>
                </div>
                <span className="text-accent-400 font-medium">Verified ✓</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={reset} className="btn-secondary">
                <HiRefresh className="w-5 h-5 mr-2 inline" />
                Verify Another
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
                <HiXCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Verification Failed</h2>
                <p className="text-gray-400">{verificationResult.reason}</p>
              </div>
            </div>

            <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-6">
              <div className="flex items-start gap-4">
                <HiExclamationCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">What does this mean?</h3>
                  <ul className="text-gray-400 space-y-2 text-sm">
                    <li>• The certificate ID may be incorrect</li>
                    <li>• The certificate may not exist in our system</li>
                    <li>• The QR code may be damaged or invalid</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={reset} className="btn-primary">
                <HiRefresh className="w-5 h-5 mr-2 inline" />
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScanVerify;
