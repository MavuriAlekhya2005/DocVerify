/**
 * Element Palette Component
 * Left panel for adding elements to the canvas
 */

import { useState, useRef } from 'react';
import {
  HiTemplate,
  HiMenuAlt2,
  HiOutlinePhotograph,
  HiQrcode,
  HiPencil,
  HiOutlineDocumentText,
  HiOutlineCube,
  HiX,
  HiChevronRight,
  HiChevronLeft,
} from 'react-icons/hi';
import { BsType, BsSquare, BsCircle, BsDash, BsImage } from 'react-icons/bs';

const ElementPalette = ({
  isOpen,
  onToggle,
  onAddText,
  onAddPlaceholder,
  onAddImage,
  onAddShape,
  onShowTemplates,
}) => {
  const [expandedSection, setExpandedSection] = useState('text');
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAddImage(event.target.result, { name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const textElements = [
    { label: 'Heading', action: () => onAddText('Heading', { fontSize: 36, fontWeight: 'bold' }) },
    { label: 'Subheading', action: () => onAddText('Subheading', { fontSize: 24 }) },
    { label: 'Body Text', action: () => onAddText('Body text goes here', { fontSize: 16 }) },
    { label: 'Caption', action: () => onAddText('Caption', { fontSize: 12, fill: '#666666' }) },
  ];

  const placeholderElements = [
    { label: 'Recipient Name', fieldId: 'recipientName' },
    { label: 'Course Name', fieldId: 'courseName' },
    { label: 'Issue Date', fieldId: 'issueDate' },
    { label: 'Expiry Date', fieldId: 'expiryDate' },
    { label: 'Certificate Number', fieldId: 'certificateNumber' },
    { label: 'Signatory Name', fieldId: 'signatoryName' },
    { label: 'Signatory Title', fieldId: 'signatoryTitle' },
    { label: 'Organization Name', fieldId: 'organizationName' },
    { label: 'Grade/Score', fieldId: 'grade' },
    { label: 'Custom Field...', fieldId: 'custom', isCustom: true },
  ];

  const shapeElements = [
    { label: 'Rectangle', icon: BsSquare, action: () => onAddShape('rectangle') },
    { label: 'Circle', icon: BsCircle, action: () => onAddShape('circle') },
    { label: 'Line', icon: BsDash, action: () => onAddShape('line') },
  ];

  const Section = ({ id, title, icon: Icon, children }) => (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition"
      >
        <Icon className="w-5 h-5 text-gray-400" />
        <span className="flex-1 text-left text-sm text-gray-300">{title}</span>
        <HiChevronRight
          className={`w-4 h-4 text-gray-500 transition-transform ${
            expandedSection === id ? 'rotate-90' : ''
          }`}
        />
      </button>
      {expandedSection === id && (
        <div className="px-4 pb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const ElementButton = ({ label, icon: Icon, onClick }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition"
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {/* Toggle Button (when collapsed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white p-2 rounded-r-lg transition"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Panel */}
      <div
        className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Elements</h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Templates Button */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={onShowTemplates}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition"
            >
              <HiTemplate className="w-5 h-5" />
              <span>Browse Templates</span>
            </button>
          </div>

          {/* Text Elements */}
          <Section id="text" title="Text" icon={BsType}>
            {textElements.map((el, idx) => (
              <ElementButton key={idx} label={el.label} onClick={el.action} />
            ))}
          </Section>

          {/* Placeholder Fields */}
          <Section id="placeholders" title="Dynamic Fields" icon={HiOutlineDocumentText}>
            <p className="text-xs text-gray-500 mb-2">
              Fields that auto-populate from sidebar data
            </p>
            {placeholderElements.map((el, idx) => (
              <ElementButton
                key={idx}
                label={el.label}
                onClick={() => {
                  if (el.isCustom) {
                    const fieldId = prompt('Enter field ID (no spaces):');
                    const label = prompt('Enter field label:');
                    if (fieldId && label) {
                      onAddPlaceholder(fieldId, label);
                    }
                  } else {
                    onAddPlaceholder(el.fieldId, el.label);
                  }
                }}
              />
            ))}
          </Section>

          {/* Images */}
          <Section id="images" title="Images" icon={BsImage}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <ElementButton
              label="Upload Image"
              icon={HiOutlinePhotograph}
              onClick={() => fileInputRef.current?.click()}
            />
            <ElementButton
              label="Logo Placeholder"
              icon={HiOutlinePhotograph}
              onClick={() => onAddImage('/placeholder-logo.png', { name: 'Logo' })}
            />
            <ElementButton
              label="Signature Area"
              icon={HiPencil}
              onClick={() => onAddShape('rectangle', { 
                width: 200, 
                height: 60, 
                fill: 'transparent',
                stroke: '#cccccc',
                strokeDashArray: [5, 5],
                name: 'Signature Area'
              })}
            />
          </Section>

          {/* Shapes */}
          <Section id="shapes" title="Shapes" icon={HiOutlineCube}>
            {shapeElements.map((el, idx) => (
              <ElementButton
                key={idx}
                label={el.label}
                icon={el.icon}
                onClick={el.action}
              />
            ))}
            <ElementButton
              label="Decorative Border"
              icon={BsSquare}
              onClick={() => onAddShape('rectangle', {
                width: 750,
                height: 1080,
                fill: 'transparent',
                stroke: '#1e40af',
                strokeWidth: 3,
                name: 'Border'
              })}
            />
          </Section>

          {/* QR Code */}
          <Section id="qr" title="Verification" icon={HiQrcode}>
            <p className="text-xs text-gray-500 mb-2">
              QR codes are auto-generated on export
            </p>
            <ElementButton
              label="QR Code Placeholder"
              icon={HiQrcode}
              onClick={() => onAddShape('rectangle', {
                width: 100,
                height: 100,
                fill: '#f0f0f0',
                stroke: '#cccccc',
                name: 'QR Code Area'
              })}
            />
          </Section>
        </div>
      </div>
    </>
  );
};

export default ElementPalette;
