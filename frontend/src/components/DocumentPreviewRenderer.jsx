import { DOCUMENT_TYPES } from '../data/documentTemplates';

const DocumentPreviewRenderer = ({
  documentType,
  template,
  formData,
  documentId,
  accessKey,
  codeImage,
  photoPreview,
  logoPreview,
  signaturePreview,
  colorMode = 'two-tone',
}) => {
  if (!template) return null;

  const colors = template.colors || {};
  const getGradient = () => {
    if (colorMode === 'solid') return colors.primary;
    if (colorMode === 'two-tone') return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
    return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`;
  };

  // Student ID Card Preview
  if (documentType === DOCUMENT_TYPES.STUDENT_ID) {
    return (
      <div className="flex justify-center">
        <div className="w-96 bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="p-4 text-center" style={{ background: getGradient() }}>
            {logoPreview && <img src={logoPreview} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain rounded-lg bg-white/20 p-1" />}
            <h1 className="text-xl font-bold" style={{ color: colors.text || '#fff' }}>{formData.institutionName || 'Institution Name'}</h1>
            <p className="text-sm opacity-90" style={{ color: colors.text || '#fff' }}>Student Identification Card</p>
          </div>
          {/* Body */}
          <div className="p-6">
            <div className="flex gap-4">
              {/* Photo */}
              <div className="w-28 h-36 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: colors.primary }}>
                {photoPreview ? <img src={photoPreview} alt="Student" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>}
              </div>
              {/* Details */}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Full Name</p>
                  <p className="font-bold text-gray-800">{formData.fullName || 'Student Name'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Student ID</p>
                  <p className="font-semibold text-gray-700">{formData.studentId || 'ID Number'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Department</p>
                  <p className="text-sm text-gray-600">{formData.department || 'Department'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Program</p>
                  <p className="text-sm text-gray-600">{formData.program || 'Program'}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Year</p>
                <p className="text-sm font-medium text-gray-700">{formData.yearOfStudy || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="text-sm font-medium text-gray-700">{formData.bloodGroup || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Issue Date</p>
                <p className="text-sm font-medium text-gray-700">{formData.issueDate || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valid Until</p>
                <p className="text-sm font-medium text-gray-700">{formData.validUntil || '-'}</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              {codeImage && <img src={codeImage} alt="QR Code" className="w-20 h-20" />}
              <div className="text-right">
                <p className="text-xs text-gray-400">Document ID</p>
                <p className="text-xs font-mono text-gray-600">{documentId}</p>
                {accessKey && <>
                  <p className="text-xs text-gray-400 mt-1">Access Key</p>
                  <p className="text-xs font-mono text-gray-600">{accessKey}</p>
                </>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bill/Invoice Preview
  if (documentType === DOCUMENT_TYPES.BILL) {
    const items = formData.items || [];
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="p-6" style={{ background: getGradient() }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {logoPreview && <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/20 p-2" />}
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: colors.text || '#fff' }}>{formData.companyName || 'Company Name'}</h1>
                  <p className="text-sm opacity-80" style={{ color: colors.text || '#fff' }}>{formData.companyAddress || 'Company Address'}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold" style={{ color: colors.text || '#fff' }}>INVOICE</h2>
                <p className="text-sm opacity-80 font-mono" style={{ color: colors.text || '#fff' }}>{formData.invoiceNumber || documentId}</p>
              </div>
            </div>
          </div>
          {/* Info */}
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs text-gray-500 uppercase mb-1">Bill To</h3>
              <p className="font-bold text-gray-800">{formData.customerName || 'Customer Name'}</p>
              <p className="text-sm text-gray-600">{formData.customerEmail || 'customer@email.com'}</p>
              <p className="text-sm text-gray-600">{formData.customerAddress || 'Customer Address'}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-xs text-gray-500">Invoice Date:</span>
                <span className="ml-2 text-sm text-gray-700">{formData.invoiceDate || '-'}</span>
              </div>
              <div className="mb-2">
                <span className="text-xs text-gray-500">Due Date:</span>
                <span className="ml-2 text-sm text-gray-700">{formData.dueDate || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Payment Method:</span>
                <span className="ml-2 text-sm text-gray-700">{formData.paymentMethod || '-'}</span>
              </div>
            </div>
          </div>
          {/* Items Table */}
          <div className="px-6">
            <table className="w-full">
              <thead>
                <tr style={{ background: colors.primary + '15' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-800">{item.description}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">${parseFloat(item.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No items</td></tr>}
              </tbody>
            </table>
          </div>
          {/* Totals */}
          <div className="p-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-700">${formData.subtotal || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({formData.taxRate || 0}%):</span>
                <span className="text-gray-700">${formData.taxAmount || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount:</span>
                <span className="text-gray-700">-${formData.discount || '0.00'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-xl" style={{ color: colors.primary }}>${formData.totalAmount || '0.00'}</span>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              {codeImage && <img src={codeImage} alt="QR Code" className="w-20 h-20" />}
              <div className="text-right flex-1">
                {formData.notes && <p className="text-sm text-gray-600 mb-2">{formData.notes}</p>}
                <p className="text-xs text-gray-400">Document ID: <span className="font-mono">{documentId}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Certificate Preview
  if (documentType === DOCUMENT_TYPES.CERTIFICATE) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Border frame */}
          <div className="m-2 border-4 rounded-xl p-1" style={{ borderColor: colors.primary }}>
            <div className="border-2 rounded-lg p-8" style={{ borderColor: colors.secondary, background: `linear-gradient(180deg, ${colors.primary}08 0%, white 30%)` }}>
              {/* Header */}
              <div className="text-center mb-8">
                {logoPreview && <img src={logoPreview} alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />}
                <h1 className="text-4xl font-bold tracking-wide" style={{ color: colors.primary }}>{formData.organizationName || 'Organization Name'}</h1>
                <div className="w-32 h-1 mx-auto my-4" style={{ background: getGradient() }}></div>
                <h2 className="text-2xl uppercase tracking-widest text-gray-600">Certificate of {formData.certificateType || 'Achievement'}</h2>
              </div>
              {/* Body */}
              <div className="text-center py-8">
                <p className="text-lg text-gray-600 mb-2">This is to certify that</p>
                <h3 className="text-4xl font-bold mb-4" style={{ color: colors.primary }}>{formData.recipientName || 'Recipient Name'}</h3>
                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                  has successfully completed the <span className="font-semibold">{formData.courseName || 'Course/Program'}</span>
                  {formData.grade && <> with grade <span className="font-bold" style={{ color: colors.primary }}>{formData.grade}</span></>}
                </p>
                {formData.description && <p className="text-gray-500 mt-4 max-w-lg mx-auto italic">{formData.description}</p>}
              </div>
              {/* Dates */}
              <div className="flex justify-center gap-16 text-center my-8">
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-semibold text-gray-700">{formData.issueDate || '-'}</p>
                </div>
                {formData.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-500">Valid Until</p>
                    <p className="font-semibold text-gray-700">{formData.expiryDate}</p>
                  </div>
                )}
              </div>
              {/* Signature */}
              <div className="flex justify-between items-end mt-12">
                <div className="text-center">
                  {signaturePreview ? <img src={signaturePreview} alt="Signature" className="h-16 mx-auto mb-2" /> :
                    <div className="w-40 border-b-2 border-gray-300 mb-2"></div>}
                  <p className="text-sm text-gray-600">{formData.signatoryName || 'Signatory Name'}</p>
                  <p className="text-xs text-gray-500">{formData.signatoryTitle || 'Title'}</p>
                </div>
                {codeImage && (
                  <div className="text-center">
                    <img src={codeImage} alt="QR Code" className="w-24 h-24 mx-auto" />
                    <p className="text-xs text-gray-400 mt-1 font-mono">{documentId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex justify-center">
      <div className="p-8 bg-white rounded-2xl shadow-xl text-center">
        <p className="text-gray-500">Preview not available for this document type</p>
      </div>
    </div>
  );
};

export default DocumentPreviewRenderer;
