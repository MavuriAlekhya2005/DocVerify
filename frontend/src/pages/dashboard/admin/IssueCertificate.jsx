import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiUser,
  HiMail,
  HiCalendar,
  HiAcademicCap,
  HiDocumentText,
  HiCheckCircle,
  HiCube,
  HiQrcode
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const IssueCertificate = () => {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    certificateType: 'degree',
    certificateTitle: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    grade: '',
    additionalFields: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState(null);

  const certificateTypes = [
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

    // Simulate certificate issuance
    await new Promise(r => setTimeout(r, 2000));

    setIssuedCertificate({
      id: 'CERT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      qrCode: 'DOC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      accessKey: Array(4).fill(0).map(() => Math.random().toString(36).substr(2, 4).toUpperCase()).join('-'),
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
    });

    setIsSubmitting(false);
    toast.success('Certificate issued successfully!');
  };

  const resetForm = () => {
    setFormData({
      recipientName: '',
      recipientEmail: '',
      certificateType: 'degree',
      certificateTitle: '',
      issueDate: '',
      expiryDate: '',
      description: '',
      grade: '',
      additionalFields: {},
    });
    setIssuedCertificate(null);
  };

  if (issuedCertificate) {
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
          <h2 className="text-2xl font-bold text-white mb-2">Certificate Issued!</h2>
          <p className="text-gray-400 mb-8">The certificate has been created and stored on the blockchain</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <HiDocumentText className="w-4 h-4" />
                Certificate ID
              </div>
              <p className="text-white font-mono">{issuedCertificate.id}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <HiCube className="w-4 h-4" />
                Block Number
              </div>
              <p className="text-white">#{issuedCertificate.blockNumber}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 md:col-span-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <HiQrcode className="w-4 h-4" />
                Verification Details
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs">QR Code</p>
                  <p className="text-white font-mono">{issuedCertificate.qrCode}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Access Key</p>
                  <p className="text-yellow-400 font-mono">{issuedCertificate.accessKey}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 md:col-span-2">
              <div className="text-gray-400 text-sm mb-2">Document Hash</div>
              <p className="text-white font-mono text-xs break-all">{issuedCertificate.hash}</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={resetForm} className="btn-secondary">
              Issue Another
            </button>
            <button className="btn-primary">
              Send to Recipient
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Issue Certificate</h1>
        <p className="text-gray-400">Create and issue a new verified certificate</p>
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
