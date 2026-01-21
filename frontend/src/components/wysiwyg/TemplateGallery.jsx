/**
 * Template Gallery Component
 * Modal for selecting pre-built document templates
 */

import { useState } from 'react';
import { HiX, HiTemplate, HiCheck, HiColorSwatch } from 'react-icons/hi';

const TEMPLATES = {
  certificate: [
    {
      id: 'cert-classic',
      name: 'Classic Certificate',
      description: 'Traditional academic certificate with elegant borders',
      preview: '/templates/certificate-classic.png',
      colors: { primary: '#1e3a5f', secondary: '#c9a227', background: '#fffef5', text: '#1e3a5f' },
      category: 'Academic',
    },
    {
      id: 'cert-modern',
      name: 'Modern Minimal',
      description: 'Clean, modern design with subtle accents',
      preview: '/templates/certificate-modern.png',
      colors: { primary: '#1e40af', secondary: '#3b82f6', background: '#ffffff', text: '#1f2937' },
      category: 'Corporate',
    },
    {
      id: 'cert-elegant',
      name: 'Elegant Gold',
      description: 'Premium design with gold accents',
      preview: '/templates/certificate-elegant.png',
      colors: { primary: '#0f172a', secondary: '#d4af37', background: '#fafafa', text: '#0f172a' },
      category: 'Premium',
    },
    {
      id: 'cert-tech',
      name: 'Tech Achievement',
      description: 'Modern tech-inspired design',
      preview: '/templates/certificate-tech.png',
      colors: { primary: '#7c3aed', secondary: '#a78bfa', background: '#0f0f23', text: '#ffffff' },
      category: 'Technology',
    },
    {
      id: 'cert-nature',
      name: 'Nature Green',
      description: 'Eco-friendly design with natural colors',
      preview: '/templates/certificate-nature.png',
      colors: { primary: '#065f46', secondary: '#10b981', background: '#f0fdf4', text: '#064e3b' },
      category: 'Environmental',
    },
    {
      id: 'cert-corporate',
      name: 'Corporate Blue',
      description: 'Professional business certificate',
      preview: '/templates/certificate-corporate.png',
      colors: { primary: '#1e3a8a', secondary: '#3b82f6', background: '#ffffff', text: '#1e3a8a' },
      category: 'Corporate',
    },
  ],
  student_id: [
    {
      id: 'sid-modern',
      name: 'Modern ID',
      description: 'Contemporary student ID design',
      preview: '/templates/student-id-modern.png',
      colors: { primary: '#1e40af', secondary: '#60a5fa', background: '#ffffff', text: '#1f2937' },
      category: 'University',
    },
    {
      id: 'sid-corporate',
      name: 'Corporate ID',
      description: 'Professional employee ID style',
      preview: '/templates/student-id-corporate.png',
      colors: { primary: '#0f172a', secondary: '#475569', background: '#f8fafc', text: '#0f172a' },
      category: 'Corporate',
    },
  ],
  bill: [
    {
      id: 'bill-professional',
      name: 'Professional Invoice',
      description: 'Clean, professional invoice template',
      preview: '/templates/bill-professional.png',
      colors: { primary: '#1f2937', secondary: '#6b7280', background: '#ffffff', text: '#1f2937' },
      category: 'Business',
    },
    {
      id: 'bill-modern',
      name: 'Modern Invoice',
      description: 'Contemporary invoice design',
      preview: '/templates/bill-modern.png',
      colors: { primary: '#7c3aed', secondary: '#a78bfa', background: '#faf5ff', text: '#1f2937' },
      category: 'Creative',
    },
  ],
};

const CATEGORIES = ['All', 'Academic', 'Corporate', 'Premium', 'Technology', 'Environmental', 'Creative'];

const TemplateGallery = ({ documentType, onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = TEMPLATES[documentType] || TEMPLATES.certificate;
  
  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  const handleStartBlank = () => {
    onSelect({
      id: 'blank',
      name: 'Blank Canvas',
      colors: { primary: '#1e40af', secondary: '#3b82f6', background: '#ffffff', text: '#1f2937' },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <HiTemplate className="w-6 h-6 text-accent-400" />
            <h2 className="text-xl font-semibold text-white">Choose a Template</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-3 border-b border-gray-700 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Blank Canvas Option */}
            <button
              onClick={handleStartBlank}
              className="group relative bg-gray-700 rounded-xl overflow-hidden aspect-[3/4] hover:ring-2 hover:ring-accent-500 transition"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-white transition">
                <div className="w-16 h-16 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center mb-3">
                  <HiTemplate className="w-8 h-8" />
                </div>
                <span className="font-medium">Start Blank</span>
                <span className="text-xs text-gray-500">Create from scratch</span>
              </div>
            </button>

            {/* Template Cards */}
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`group relative bg-gray-700 rounded-xl overflow-hidden aspect-[3/4] transition ${
                  selectedTemplate?.id === template.id
                    ? 'ring-2 ring-accent-500'
                    : 'hover:ring-2 hover:ring-gray-500'
                }`}
              >
                {/* Preview Image or Placeholder */}
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: template.colors.background }}
                >
                  {/* Placeholder design */}
                  <div className="h-full p-4 flex flex-col">
                    <div 
                      className="h-2 w-1/2 mx-auto rounded mb-2"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div 
                      className="h-1 w-1/3 mx-auto rounded mb-4"
                      style={{ backgroundColor: template.colors.secondary }}
                    />
                    <div className="flex-1 flex items-center justify-center">
                      <div 
                        className="text-center"
                        style={{ color: template.colors.text }}
                      >
                        <div className="h-1 w-20 mx-auto rounded mb-2 bg-gray-300" />
                        <div 
                          className="h-3 w-32 mx-auto rounded mb-2"
                          style={{ backgroundColor: template.colors.primary }}
                        />
                        <div className="h-1 w-24 mx-auto rounded bg-gray-300" />
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: template.colors.secondary + '40' }}
                      />
                      <div 
                        className="h-1 w-16 rounded"
                        style={{ backgroundColor: template.colors.secondary }}
                      />
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                    <HiCheck className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-sm font-medium text-white">{template.name}</h3>
                  <p className="text-xs text-gray-400 truncate">{template.description}</p>
                  
                  {/* Color Swatches */}
                  <div className="flex gap-1 mt-2">
                    {Object.entries(template.colors).slice(0, 3).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <HiColorSwatch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No templates in this category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {selectedTemplate ? (
              <span>Selected: <span className="text-white">{selectedTemplate.name}</span></span>
            ) : (
              <span>Select a template to continue</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedTemplate}
              className={`px-6 py-2 rounded-lg transition ${
                selectedTemplate
                  ? 'bg-accent-500 hover:bg-accent-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
