import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { 
  HiCloudUpload, 
  HiDocumentText, 
  HiX, 
  HiCheckCircle,
  HiExclamationCircle,
  HiCube,
  HiQrcode,
  HiDownload
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const UploadCertificate = () => {
  const [files, setFiles] = useState([]);
  const [processingState, setProcessingState] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
    }));
    setFiles(newFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select a document to upload');
      return;
    }

    setProcessingState('uploading');

    try {
      // Use filename as title
      const title = files[0].file.name.replace(/\.[^/.]+$/, '');
      const result = await api.upload(files[0].file, title);

      if (result.success) {
        setProcessingState('complete');
        setUploadResult(result.data);
        toast.success('Document uploaded successfully!');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
      setProcessingState(null);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${uploadResult.certificateId}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const resetUpload = () => {
    setFiles([]);
    setProcessingState(null);
    setUploadResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Upload Document</h1>
        <p className="text-gray-400">Upload a document to generate a verifiable record with unique ID and QR code</p>
      </div>

      <AnimatePresence mode="wait">
        {!processingState ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-white/20 hover:border-primary-500/50 bg-dark-100/30'
                }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 
                flex items-center justify-center">
                <HiCloudUpload className="w-8 h-8 text-primary-400" />
              </div>
              {isDragActive ? (
                <p className="text-white text-lg">Drop your document here...</p>
              ) : (
                <>
                  <p className="text-white text-lg mb-2">Drag & drop your document here</p>
                  <p className="text-gray-400 text-sm mb-4">or click to browse files</p>
                  <p className="text-gray-500 text-xs">Supports: PDF, JPEG, PNG (max 10MB)</p>
                </>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-dark-100/50 rounded-xl border border-white/10"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                      <HiDocumentText className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.file.name}</p>
                      <p className="text-gray-400 text-sm">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => removeFile(item.id)} className="p-2 text-gray-400 hover:text-red-400">
                      <HiX className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <button onClick={handleUpload} className="w-full btn-primary mt-6">
                  Issue Certificate
                </button>
              </div>
            )}
          </motion.div>
        ) : processingState === 'uploading' ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-600/20 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Processing...</h2>
            <p className="text-gray-400">Uploading and generating certificate</p>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-100/50 rounded-2xl border border-white/10 p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-600/20 flex items-center justify-center">
                <HiCheckCircle className="w-12 h-12 text-accent-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Certificate Issued!</h2>
              <p className="text-gray-400">Your document has been hashed and a certificate has been generated</p>
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Certificate Info */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <HiCube className="w-6 h-6 text-primary-400" />
                  <h3 className="text-white font-semibold">Certificate Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Certificate ID</div>
                    <div className="text-white font-mono">{uploadResult?.certificateId}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Document Name</div>
                    <div className="text-white">{uploadResult?.title}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Document Hash (SHA-256)</div>
                    <div className="text-white text-xs font-mono break-all">{uploadResult?.documentHash}</div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <HiQrcode className="w-6 h-6 text-primary-400" />
                  <h3 className="text-white font-semibold">Verification QR Code</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg">
                    <QRCode
                      id="qr-code"
                      value={JSON.stringify({ 
                        certificateId: uploadResult?.certificateId, 
                        accessKey: uploadResult?.accessKey 
                      })}
                      size={100}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm mb-2">Scan to verify this certificate</p>
                    <button onClick={downloadQR} className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm">
                      <HiDownload className="w-4 h-4" />
                      Download QR
                    </button>
                  </div>
                </div>
              </div>

              {/* Access Key */}
              <div className="md:col-span-2 bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <HiExclamationCircle className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-white font-semibold">Private Access Key</h3>
                </div>
                <div className="bg-dark-200/50 rounded-lg p-4 mb-3">
                  <code className="text-yellow-400 font-mono text-lg">{uploadResult?.accessKey}</code>
                </div>
                <p className="text-gray-400 text-sm">
                  ⚠️ Save this key securely! It's required for full certificate verification and cannot be recovered.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button onClick={resetUpload} className="btn-secondary">
                Upload Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadCertificate;
