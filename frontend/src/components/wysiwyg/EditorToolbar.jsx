/**
 * Editor Toolbar Component
 * Top toolbar with formatting options, zoom, undo/redo, and export buttons
 */

import { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import {
  HiSave,
  HiDownload,
  HiArrowLeft,
  HiArrowRight,
  HiZoomIn,
  HiZoomOut,
  HiRefresh,
  HiX,
  HiMenuAlt2,
  HiDocumentDownload,
  HiPhotograph,
} from 'react-icons/hi';
import {
  BsTypeBold,
  BsTypeItalic,
  BsTypeUnderline,
  BsTypeStrikethrough,
  BsTextLeft,
  BsTextCenter,
  BsTextRight,
  BsType,
} from 'react-icons/bs';

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Helvetica',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96];

const EditorToolbar = ({
  selectedObject,
  canvas,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onExportPDF,
  onExportPNG,
  onClose,
  isDirty,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#333333');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('left');

  // Update toolbar state when object is selected
  useEffect(() => {
    if (selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text')) {
      setCurrentColor(selectedObject.fill || '#333333');
      setFontSize(selectedObject.fontSize || 24);
      setFontFamily(selectedObject.fontFamily || 'Arial');
      setIsBold(selectedObject.fontWeight === 'bold');
      setIsItalic(selectedObject.fontStyle === 'italic');
      setIsUnderline(selectedObject.underline || false);
      setTextAlign(selectedObject.textAlign || 'left');
    }
  }, [selectedObject]);

  // Apply formatting to selected text object
  const applyFormat = (property, value) => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.type !== 'i-text' && selectedObject.type !== 'text') return;

    selectedObject.set(property, value);
    canvas.renderAll();
  };

  const toggleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    applyFormat('fontWeight', newBold ? 'bold' : 'normal');
  };

  const toggleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    applyFormat('fontStyle', newItalic ? 'italic' : 'normal');
  };

  const toggleUnderline = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    applyFormat('underline', newUnderline);
  };

  const handleColorChange = (color) => {
    setCurrentColor(color.hex);
    applyFormat('fill', color.hex);
  };

  const handleFontSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setFontSize(size);
    applyFormat('fontSize', size);
  };

  const handleFontFamilyChange = (e) => {
    const family = e.target.value;
    setFontFamily(family);
    applyFormat('fontFamily', family);
  };

  const handleTextAlign = (align) => {
    setTextAlign(align);
    applyFormat('textAlign', align);
  };

  const isTextSelected = selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text');

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left Section - File Operations */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition"
              title="Close"
            >
              <HiX className="w-5 h-5" />
            </button>
          )}
          
          <div className="w-px h-6 bg-gray-600 mx-2" />
          
          <button
            onClick={onSave}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
              isDirty 
                ? 'bg-accent-500 text-white hover:bg-accent-600' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Save"
          >
            <HiSave className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </button>

          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Undo/Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition ${
              canUndo 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition ${
              canRedo 
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <HiArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center Section - Text Formatting */}
        <div className="flex items-center gap-2">
          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={handleFontFamilyChange}
            disabled={!isTextSelected}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {FONT_FAMILIES.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={fontSize}
            onChange={handleFontSizeChange}
            disabled={!isTextSelected}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed w-20"
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Bold, Italic, Underline */}
          <button
            onClick={toggleBold}
            disabled={!isTextSelected}
            className={`p-2 rounded-lg transition ${
              isBold ? 'bg-accent-500 text-white' : 'hover:bg-gray-700 text-gray-300'
            } ${!isTextSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Bold"
          >
            <BsTypeBold className="w-4 h-4" />
          </button>
          <button
            onClick={toggleItalic}
            disabled={!isTextSelected}
            className={`p-2 rounded-lg transition ${
              isItalic ? 'bg-accent-500 text-white' : 'hover:bg-gray-700 text-gray-300'
            } ${!isTextSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Italic"
          >
            <BsTypeItalic className="w-4 h-4" />
          </button>
          <button
            onClick={toggleUnderline}
            disabled={!isTextSelected}
            className={`p-2 rounded-lg transition ${
              isUnderline ? 'bg-accent-500 text-white' : 'hover:bg-gray-700 text-gray-300'
            } ${!isTextSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Underline"
          >
            <BsTypeUnderline className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Text Alignment */}
          <button
            onClick={() => handleTextAlign('left')}
            disabled={!isTextSelected}
            className={`p-2 rounded-lg transition ${
              textAlign === 'left' ? 'bg-accent-500 text-white' : 'hover:bg-gray-700 text-gray-300'
            } ${!isTextSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Align Left"
          >
            <BsTextLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleTextAlign('center')}
            disabled={!isTextSelected}
            className={`p-2 rounded-lg transition ${
              textAlign === 'center' ? 'bg-accent-500 text-white' : 'hover:bg-gray-700 text-gray-300'
            } ${!isTextSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Align Center"
          >
            <BsTextCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleTextAlign('right')}
            disabled={!isTextSelected}
            className={`p-2 rounded-lg transition ${
              textAlign === 'right' ? 'bg-accent-500 text-white' : 'hover:bg-gray-700 text-gray-300'
            } ${!isTextSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Align Right"
          >
            <BsTextRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={!isTextSelected}
              className={`p-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-1 ${
                !isTextSelected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Text Color"
            >
              <BsType className="w-4 h-4 text-gray-300" />
              <div
                className="w-4 h-4 rounded border border-gray-500"
                style={{ backgroundColor: currentColor }}
              />
            </button>
            
            {showColorPicker && isTextSelected && (
              <div className="absolute top-full left-0 mt-2 z-50">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowColorPicker(false)} 
                />
                <div className="relative">
                  <ChromePicker
                    color={currentColor}
                    onChange={handleColorChange}
                    disableAlpha
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Zoom & Export */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition"
            title="Zoom Out"
          >
            <HiZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={onZoomReset}
            className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 hover:bg-gray-600 transition min-w-[60px]"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition"
            title="Zoom In"
          >
            <HiZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Export Buttons */}
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            title="Export as PDF"
          >
            <HiDocumentDownload className="w-4 h-4" />
            <span className="text-sm">PDF</span>
          </button>
          <button
            onClick={onExportPNG}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            title="Export as PNG"
          >
            <HiPhotograph className="w-4 h-4" />
            <span className="text-sm">PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
