import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { 
  HiUser,
  HiMail,
  HiCalendar,
  HiAcademicCap,
  HiDocumentText,
  HiCheckCircle,
  HiCube,
  HiQrcode,
  HiDownload,
  HiKey
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const IssueCertificate = () => {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    documentType: 'degree',
    documentTitle: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    grade: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedDocument, setIssuedDocument] = useState(null);

  const documentTypes = [
    { value: 'degree', label: 'Academic Degree' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'certification', label: 'Professional Certification' },
    { value: 'experience', label: 'Experience Letter' },
    { value: 'course', label: 'Course Completion' },
    { value: 'award', label: 'Award/Achievement' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await api.issueCertificate(formData);
      
      if (result.success) {
        setIssuedDocument(result.data);
        toast.success('Document issued successfully!');
      } else {
        toast.error(result.message || 'Failed to issue document');
      }
    } catch (error) {
      toast.error('Failed to issue document. Please try again.');
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      recipientName: '',
      recipientEmail: '',
      documentType: 'degree',
      documentTitle: '',
      issueDate: '',
      expiryDate: '',
      description: '',
      grade: '',
    });
    setIssuedDocument(null);
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
      link.download = `${issuedDocument.certificateId}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (issuedDocument) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-dark-100/50 rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-600/20 flex items-center justify-center">
            <HiCheckCircle className="w-12 h-12 text-accent-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Document Issued!</h2>
          <p className="text-gray-400 mb-8">The document has been created and stored successfully</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <HiDocumentText className="w-4 h-4" />
                Document ID
              </div>
              <p className="text-white font-mono">{issuedDocument.certificateId}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <HiKey className="w-4 h-4" />
                Access Key
              </div>
              <p className="text-yellow-400 font-mono text-sm">{issuedDocument.accessKey}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 md:col-span-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <HiQrcode className="w-4 h-4" />
                QR Code for Verification
              </div>
              <div className="flex justify-center my-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCode
                    id="qr-code"
                    value={JSON.stringify({ certificateId: issuedDocument.certificateId, accessKey: issuedDocument.accessKey })}
                    size={150}
                  />
                </div>
              </div>
              <button
                onClick={downloadQR}
                className="flex items-center gap-2 mx-auto text-primary-400 hover:text-primary-300 text-sm"
              >
                <HiDownload className="w-4 h-4" />
                Download QR Code
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 md:col-span-2">
              <div className="text-gray-400 text-sm mb-2">Document Hash</div>
              <p className="text-white font-mono text-xs break-all">{issuedDocument.documentHash}</p>
            </div>
          </div>

          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              <strong>Important:</strong> Save the Access Key securely. It's required for full document verification and download.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={resetForm} className="btn-secondary">
              Issue Another
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Issue Document</h1>
        <p className="text-gray-400">Create and issue a new verified document</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-dark-100/50 rounded-2xl border border-white/10 p-8"
      >
        <div className="space-y-6">
          {/* Recipient Info */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <HiUser className="w-5 h-5 text-primary-400" />
              Recipient Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Enter recipient's full name"
                  className="input-field-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  placeholder="Enter recipient's email"
                  className="input-field-dark"
                  required
                />
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <HiAcademicCap className="w-5 h-5 text-primary-400" />
              Certificate Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Certificate Type *
                </label>
                <select
                  name="certificateType"
                  value={formData.certificateType}
                  onChange={handleChange}
                  className="input-field-dark"
                  required
                >
                  {certificateTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  name="certificateTitle"
                  value={formData.certificateTitle}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor of Computer Science"
                  className="input-field-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  className="input-field-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="input-field-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grade/Score (Optional)
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="e.g., A+, 3.8 GPA, 95%"
                  className="input-field-dark"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Enter certificate description or achievements"
                className="input-field-dark resize-none"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-4">
            <p className="text-primary-400 text-sm">
              <strong>Note:</strong> Once issued, the certificate will be permanently stored on the blockchain 
              and cannot be modified. A unique QR code and access key will be generated for verification.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 
                border border-white/10 transition-all"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Issuing...
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-5 h-5" />
                  Issue Certificate
                </>
              )}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
};

export default IssueCertificate;
