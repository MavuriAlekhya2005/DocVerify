/**
 * AI Enhanced Form Component
 * Wrapper that adds AI capabilities to form fields
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiLightningBolt,
  HiRefresh,
  HiCloudUpload,
  HiDocumentText,
  HiCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi';
import api from '../../services/api';

/**
 * AIEnhancedField - Wraps an input with AI suggestion capabilities
 */
export const AIEnhancedField = ({
  name,
  label,
  value,
  onChange,
  documentType,
  placeholder,
  type = 'text',
  required = false,
  className = '',
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced fetch suggestions
  useEffect(() => {
    if (!value || value.length < 2 || type !== 'text') return;
    
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await api.aiSuggest({ [name]: value }, documentType);
        if (result.success && result.data?.suggestions) {
          const fieldSuggestions = result.data.suggestions[name] || [];
          setSuggestions(fieldSuggestions.slice(0, 5));
          setShowSuggestions(fieldSuggestions.length > 0);
        }
      } catch (err) {
        console.error('AI suggestion error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [value, name, documentType, type]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onChange({ target: { value: suggestions[selectedIndex] } });
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    onChange({ target: { value: suggestion } });
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {isLoading && (
          <span className="ml-2 text-primary-400">
            <HiLightningBolt className="w-3 h-3 inline animate-pulse" />
          </span>
        )}
      </label>
      
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white 
          focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
      
      {/* AI Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-dark-200 border border-white/10 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="px-3 py-2 text-xs text-primary-400 border-b border-white/10 flex items-center gap-1">
              <HiLightningBolt className="w-3 h-3" />
              AI Suggestions
            </div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors
                  ${idx === selectedIndex 
                    ? 'bg-primary-500/20 text-primary-300' 
                    : 'text-gray-300 hover:bg-white/5'}`}
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * AIDocumentUploader - Extracts fields from uploaded documents
 */
export const AIDocumentUploader = ({
  documentType,
  onFieldsExtracted,
  onDocumentTypeDetected,
  className = '',
}) => {
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (uploadedFile) => {
    setFile(uploadedFile);
    setError(null);
    setExtractedData(null);
    setIsExtracting(true);

    try {
      // Read file as text/base64 for AI processing
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          // Try to extract text if it's a text file
          const content = reader.result;
          
          const result = await api.aiExtract(
            content.substring(0, 10000), // Limit content size
            documentType
          );

          if (result.success) {
            setExtractedData(result.data);
            
            if (onDocumentTypeDetected && result.data.schema) {
              onDocumentTypeDetected(result.data.schema);
            }
            
            if (onFieldsExtracted && result.data.fields) {
              // Convert fields object to form data
              const formData = {};
              Object.entries(result.data.fields).forEach(([key, field]) => {
                if (field.value) {
                  formData[key] = field.value;
                }
              });
              onFieldsExtracted(formData);
            }
          } else {
            throw new Error(result.message || 'Extraction failed');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setIsExtracting(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsExtracting(false);
      };

      // Read as text for documents
      if (uploadedFile.type.includes('text') || uploadedFile.name.endsWith('.txt')) {
        reader.readAsText(uploadedFile);
      } else {
        reader.readAsDataURL(uploadedFile);
      }
    } catch (err) {
      setError(err.message);
      setIsExtracting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setExtractedData(null);
    setError(null);
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
            ${dragActive 
              ? 'border-primary-500 bg-primary-500/10' 
              : 'border-white/20 hover:border-primary-500/50'}`}
        >
          <input
            type="file"
            onChange={handleFileInput}
            accept=".pdf,.txt,.doc,.docx,image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <HiCloudUpload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-white font-medium mb-1">
            Upload document for AI extraction
          </p>
          <p className="text-gray-400 text-sm">
            Drop a file or click to browse
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-primary-400">
            <HiLightningBolt className="w-3 h-3" />
            AI will auto-fill form fields
          </div>
        </div>
      )}

      {/* Extracting State */}
      {isExtracting && (
        <div className="bg-dark-200 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-white font-medium">{file?.name}</p>
              <p className="text-gray-400 text-sm">Extracting fields with AI...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <HiExclamationCircle className="w-6 h-6 text-red-400" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-white text-sm">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {extractedData && !isExtracting && (
        <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <HiCheckCircle className="w-6 h-6 text-accent-400" />
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Fields extracted successfully!</p>
              <p className="text-accent-400 text-xs">
                {Object.keys(extractedData.fields || {}).length} fields found
                {extractedData.confidence && ` (${extractedData.confidence}% confidence)`}
              </p>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-white">
              <HiRefresh className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AIFormHelper - Status bar showing AI assistance is available
 */
export const AIFormHelper = ({ isActive = true }) => {
  const [aiStatus, setAIStatus] = useState(null);

  useEffect(() => {
    api.getAIStatus().then(result => {
      if (result.success) {
        setAIStatus(result.data);
      }
    }).catch(() => {});
  }, []);

  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
      aiStatus?.available
        ? 'bg-primary-600/20 text-primary-400'
        : 'bg-yellow-600/20 text-yellow-400'
    }`}>
      <HiLightningBolt className="w-4 h-4" />
      <span>
        {aiStatus?.available 
          ? 'AI assistance enabled - Start typing for smart suggestions'
          : 'Basic suggestions available - Set up OpenAI for enhanced AI'
        }
      </span>
    </div>
  );
};

export default {
  AIEnhancedField,
  AIDocumentUploader,
  AIFormHelper,
};
