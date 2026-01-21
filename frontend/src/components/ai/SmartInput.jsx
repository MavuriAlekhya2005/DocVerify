/**
 * AI-Powered Smart Input Component
 * Provides auto-suggestions and intelligent field completion
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { HiLightningBolt, HiX, HiChevronDown } from 'react-icons/hi';
import api from '../../services/api';

const SmartInput = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  context = {},
  className = '',
  aiEnabled = true,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch suggestions when value changes
  const fetchSuggestions = useCallback(async (searchValue) => {
    if (!aiEnabled || !searchValue || searchValue.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.aiSuggest(name, searchValue, context);
      if (result.success && result.data?.suggestions) {
        setSuggestions(result.data.suggestions);
        setShowSuggestions(result.data.suggestions.length > 0);
      }
    } catch (error) {
      console.error('Suggestion fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [name, context, aiEnabled]);

  // Debounced suggestion fetch
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value && value.length >= 2 && aiEnabled) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions, aiEnabled]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { name, value: suggestion } });
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-gray-300 text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {aiEnabled && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary-400">
            <HiLightningBolt className="w-3 h-3" />
            AI-assisted
          </span>
        )}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`input-field w-full pr-10 ${
            aiEnabled ? 'border-primary-500/30' : ''
          }`}
        />
        
        {/* Loading/AI indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
          ) : aiEnabled && value && value.length >= 2 ? (
            <HiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              showSuggestions ? 'rotate-180' : ''
            }`} />
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-dark-100 border border-white/10 rounded-lg shadow-xl overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs text-gray-400">AI Suggestions</span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-white"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary-600/30 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SmartInput;
