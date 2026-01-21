/**
 * WYSIWYG Document Editor - Main Component
 * Full-featured visual document editor with canvas, toolbar, and sidebar
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import {
  HiSave,
  HiDownload,
  HiEye,
  HiTemplate,
  HiPhotograph,
  HiQrcode,
  HiPencil,
  HiTrash,
  HiDuplicate,
  HiArrowUp,
  HiArrowDown,
  HiRefresh,
  HiX,
  HiPlus,
  HiDocumentText,
  HiColorSwatch,
  HiMenu,
} from 'react-icons/hi';
import EditorToolbar from './EditorToolbar';
import EditorSidebar from './EditorSidebar';
import ElementPalette from './ElementPalette';
import TemplateGallery from './TemplateGallery';
import { exportToPDF, exportToPNG } from './utils/exportUtils';
import api from '../../services/api';

// Default canvas dimensions (A4 at 96 DPI)
const CANVAS_WIDTH = 794;
const CANVAS_HEIGHT = 1123;

const WYSIWYGEditor = ({ 
  documentType = 'certificate',
  initialTemplate = null,
  initialData = null,
  onSave = null,
  onClose = null,
}) => {
  // Canvas ref and fabric instance
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [canvasObjects, setCanvasObjects] = useState([]);
  const [documentData, setDocumentData] = useState({
    id: uuidv4(),
    type: documentType,
    fields: {},
    createdAt: new Date().toISOString(),
  });
  const [showTemplates, setShowTemplates] = useState(!initialTemplate);
  const [showElements, setShowElements] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Event listeners
    canvas.on('selection:created', handleObjectSelected);
    canvas.on('selection:updated', handleObjectSelected);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);

    // Load initial template or data
    if (initialTemplate) {
      loadTemplate(initialTemplate);
    } else if (initialData) {
      loadCanvasData(initialData);
    }

    setIsLoading(false);

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  // Handle object selection
  const handleObjectSelected = (e) => {
    setSelectedObject(e.selected?.[0] || null);
  };

  const handleSelectionCleared = () => {
    setSelectedObject(null);
  };

  // Handle canvas changes
  const handleObjectModified = () => {
    saveToHistory();
    setIsDirty(true);
    updateCanvasObjects();
  };

  const handleCanvasChange = () => {
    updateCanvasObjects();
  };

  // Update canvas objects list
  const updateCanvasObjects = useCallback(() => {
    if (!fabricRef.current) return;
    const objects = fabricRef.current.getObjects().map((obj, index) => ({
      id: obj.id || `obj-${index}`,
      type: obj.type,
      name: obj.name || `${obj.type}-${index}`,
      visible: obj.visible !== false,
      locked: obj.lockMovementX && obj.lockMovementY,
    }));
    setCanvasObjects(objects);
  }, []);

  // History management
  const saveToHistory = () => {
    if (!fabricRef.current) return;
    const json = fabricRef.current.toJSON(['id', 'name', 'fieldId', 'isPlaceholder']);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = async () => {
    if (historyIndex <= 0 || !fabricRef.current) return;
    const prevIndex = historyIndex - 1;
    await fabricRef.current.loadFromJSON(history[prevIndex]);
    fabricRef.current.renderAll();
    setHistoryIndex(prevIndex);
    updateCanvasObjects();
  };

  const redo = async () => {
    if (historyIndex >= history.length - 1 || !fabricRef.current) return;
    const nextIndex = historyIndex + 1;
    await fabricRef.current.loadFromJSON(history[nextIndex]);
    fabricRef.current.renderAll();
    setHistoryIndex(nextIndex);
    updateCanvasObjects();
  };

  // Template loading
  const loadTemplate = async (template) => {
    if (!fabricRef.current) return;
    
    fabricRef.current.clear();
    
    // Load template background and elements
    if (template.canvasData) {
      await fabricRef.current.loadFromJSON(template.canvasData);
      fabricRef.current.renderAll();
      saveToHistory();
      updateCanvasObjects();
    } else {
      // Create default template structure
      createDefaultTemplate(template);
    }
    
    setShowTemplates(false);
  };

  // Create default template based on type
  const createDefaultTemplate = (template) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Add background (Fabric.js v7 syntax)
    canvas.backgroundColor = template.colors?.background || '#ffffff';
    canvas.renderAll();

    // Add border
    const border = new fabric.Rect({
      left: 20,
      top: 20,
      width: CANVAS_WIDTH - 40,
      height: CANVAS_HEIGHT - 40,
      fill: 'transparent',
      stroke: template.colors?.primary || '#1e40af',
      strokeWidth: 3,
      selectable: false,
      id: 'border',
      name: 'Border',
    });
    canvas.add(border);

    // Add inner border
    const innerBorder = new fabric.Rect({
      left: 30,
      top: 30,
      width: CANVAS_WIDTH - 60,
      height: CANVAS_HEIGHT - 60,
      fill: 'transparent',
      stroke: template.colors?.secondary || '#3b82f6',
      strokeWidth: 1,
      selectable: false,
      id: 'inner-border',
      name: 'Inner Border',
    });
    canvas.add(innerBorder);

    // Add title placeholder
    const title = new fabric.IText('CERTIFICATE', {
      left: CANVAS_WIDTH / 2,
      top: 100,
      fontSize: 48,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      fill: template.colors?.primary || '#1e40af',
      originX: 'center',
      id: 'title',
      name: 'Title',
      isPlaceholder: false,
    });
    canvas.add(title);

    // Add subtitle
    const subtitle = new fabric.IText('of Achievement', {
      left: CANVAS_WIDTH / 2,
      top: 160,
      fontSize: 24,
      fontFamily: 'Georgia',
      fill: '#666666',
      originX: 'center',
      id: 'subtitle',
      name: 'Subtitle',
    });
    canvas.add(subtitle);

    // Add "This certifies that" text
    const certifyText = new fabric.IText('This is to certify that', {
      left: CANVAS_WIDTH / 2,
      top: 280,
      fontSize: 18,
      fontFamily: 'Georgia',
      fill: '#333333',
      originX: 'center',
      id: 'certify-text',
      name: 'Certify Text',
    });
    canvas.add(certifyText);

    // Add recipient name placeholder
    const recipientName = new fabric.IText('{{recipientName}}', {
      left: CANVAS_WIDTH / 2,
      top: 340,
      fontSize: 36,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      fill: template.colors?.primary || '#1e40af',
      originX: 'center',
      id: 'recipient-name',
      name: 'Recipient Name',
      fieldId: 'recipientName',
      isPlaceholder: true,
    });
    canvas.add(recipientName);

    // Add description text
    const description = new fabric.IText('has successfully completed', {
      left: CANVAS_WIDTH / 2,
      top: 420,
      fontSize: 18,
      fontFamily: 'Georgia',
      fill: '#333333',
      originX: 'center',
      id: 'description',
      name: 'Description',
    });
    canvas.add(description);

    // Add course/achievement placeholder
    const courseName = new fabric.IText('{{courseName}}', {
      left: CANVAS_WIDTH / 2,
      top: 470,
      fontSize: 28,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      fill: '#333333',
      originX: 'center',
      id: 'course-name',
      name: 'Course Name',
      fieldId: 'courseName',
      isPlaceholder: true,
    });
    canvas.add(courseName);

    // Add date placeholder
    const dateText = new fabric.IText('Issued on {{issueDate}}', {
      left: CANVAS_WIDTH / 2,
      top: 550,
      fontSize: 16,
      fontFamily: 'Georgia',
      fill: '#666666',
      originX: 'center',
      id: 'issue-date',
      name: 'Issue Date',
      fieldId: 'issueDate',
      isPlaceholder: true,
    });
    canvas.add(dateText);

    // Add signature line
    const sigLine = new fabric.Line([CANVAS_WIDTH / 2 - 100, 700, CANVAS_WIDTH / 2 + 100, 700], {
      stroke: '#333333',
      strokeWidth: 1,
      id: 'signature-line',
      name: 'Signature Line',
    });
    canvas.add(sigLine);

    // Add signatory name placeholder
    const signatoryName = new fabric.IText('{{signatoryName}}', {
      left: CANVAS_WIDTH / 2,
      top: 710,
      fontSize: 16,
      fontFamily: 'Georgia',
      fill: '#333333',
      originX: 'center',
      id: 'signatory-name',
      name: 'Signatory Name',
      fieldId: 'signatoryName',
      isPlaceholder: true,
    });
    canvas.add(signatoryName);

    // Add signatory title
    const signatoryTitle = new fabric.IText('{{signatoryTitle}}', {
      left: CANVAS_WIDTH / 2,
      top: 735,
      fontSize: 14,
      fontFamily: 'Georgia',
      fontStyle: 'italic',
      fill: '#666666',
      originX: 'center',
      id: 'signatory-title',
      name: 'Signatory Title',
      fieldId: 'signatoryTitle',
      isPlaceholder: true,
    });
    canvas.add(signatoryTitle);

    // Add QR code placeholder area
    const qrPlaceholder = new fabric.Rect({
      left: CANVAS_WIDTH - 150,
      top: CANVAS_HEIGHT - 180,
      width: 100,
      height: 100,
      fill: '#f0f0f0',
      stroke: '#cccccc',
      strokeWidth: 1,
      id: 'qr-placeholder',
      name: 'QR Code Area',
    });
    canvas.add(qrPlaceholder);

    const qrText = new fabric.IText('QR Code', {
      left: CANVAS_WIDTH - 100,
      top: CANVAS_HEIGHT - 130,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#999999',
      originX: 'center',
      selectable: false,
      id: 'qr-text',
      name: 'QR Label',
    });
    canvas.add(qrText);

    canvas.renderAll();
    saveToHistory();
    updateCanvasObjects();
  };

  // Load existing canvas data
  const loadCanvasData = async (data) => {
    if (!fabricRef.current || !data) return;
    await fabricRef.current.loadFromJSON(data);
    fabricRef.current.renderAll();
    saveToHistory();
    updateCanvasObjects();
  };

  // Add elements to canvas
  const addText = (text = 'New Text', options = {}) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const textObj = new fabric.IText(text, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fontSize: options.fontSize || 24,
      fontFamily: options.fontFamily || 'Arial',
      fill: options.fill || '#333333',
      originX: 'center',
      id: uuidv4(),
      name: options.name || 'Text',
      ...options,
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    saveToHistory();
  };

  const addPlaceholder = (fieldId, displayText, options = {}) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const placeholder = new fabric.IText(`{{${fieldId}}}`, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fontSize: options.fontSize || 24,
      fontFamily: options.fontFamily || 'Arial',
      fill: options.fill || '#1e40af',
      originX: 'center',
      id: uuidv4(),
      name: displayText || fieldId,
      fieldId: fieldId,
      isPlaceholder: true,
      ...options,
    });

    canvas.add(placeholder);
    canvas.setActiveObject(placeholder);
    canvas.renderAll();
    saveToHistory();

    // Add field to document data
    setDocumentData(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: { label: displayText, value: '', type: 'text' },
      },
    }));
  };

  const addImage = (imageUrl, options = {}) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
      img.set({
        left: options.left || CANVAS_WIDTH / 2,
        top: options.top || CANVAS_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        id: uuidv4(),
        name: options.name || 'Image',
        ...options,
      });

      // Scale to reasonable size
      if (img.width > 300) {
        img.scaleToWidth(300);
      }

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveToHistory();
    });
  };

  const addShape = (shapeType, options = {}) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let shape;
    const defaultOptions = {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fill: options.fill || 'transparent',
      stroke: options.stroke || '#333333',
      strokeWidth: options.strokeWidth || 2,
      originX: 'center',
      originY: 'center',
      id: uuidv4(),
      name: options.name || shapeType,
    };

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          ...defaultOptions,
          width: options.width || 200,
          height: options.height || 100,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          ...defaultOptions,
          radius: options.radius || 50,
        });
        break;
      case 'line':
        shape = new fabric.Line([0, 0, 200, 0], {
          ...defaultOptions,
          originX: 'left',
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveToHistory();
  };

  // Delete selected object
  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveToHistory();
      setSelectedObject(null);
    }
  };

  // Duplicate selected object
  const duplicateSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned) => {
        cloned.set({
          left: activeObject.left + 20,
          top: activeObject.top + 20,
          id: uuidv4(),
          name: `${activeObject.name} Copy`,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveToHistory();
      });
    }
  };

  // Layer management
  const bringForward = () => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedObject) return;
    canvas.bringForward(selectedObject);
    canvas.renderAll();
    saveToHistory();
  };

  const sendBackward = () => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedObject) return;
    canvas.sendBackwards(selectedObject);
    canvas.renderAll();
    saveToHistory();
  };

  // Update field value
  const updateFieldValue = (fieldId, value) => {
    setDocumentData(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: { ...prev.fields[fieldId], value },
      },
    }));
    setIsDirty(true);

    // Update placeholder on canvas
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach(obj => {
      if (obj.fieldId === fieldId && obj.isPlaceholder) {
        // Keep the placeholder format but show value
        obj.set('text', value || `{{${fieldId}}}`);
      }
    });
    canvas.renderAll();
  };

  // Replace placeholders with actual values for export
  const prepareFinalCanvas = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach(obj => {
      if (obj.isPlaceholder && obj.fieldId) {
        const fieldValue = documentData.fields[obj.fieldId]?.value;
        if (fieldValue) {
          obj.set('text', fieldValue);
        }
      }
    });
    canvas.renderAll();
  };

  // Export functions
  const handleExportPDF = async () => {
    try {
      prepareFinalCanvas();
      await exportToPDF(fabricRef.current, documentData.id);
      toast.success('PDF exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  const handleExportPNG = async () => {
    try {
      prepareFinalCanvas();
      await exportToPNG(fabricRef.current, documentData.id);
      toast.success('PNG exported successfully!');
    } catch (error) {
      toast.error('Failed to export PNG');
      console.error(error);
    }
  };

  // Save document
  const handleSave = async () => {
    if (!fabricRef.current) return;

    try {
      const canvasData = fabricRef.current.toJSON(['id', 'name', 'fieldId', 'isPlaceholder']);
      
      const documentPayload = {
        ...documentData,
        canvasData,
        updatedAt: new Date().toISOString(),
      };

      if (onSave) {
        await onSave(documentPayload);
      }

      setIsDirty(false);
      toast.success('Document saved!');
    } catch (error) {
      toast.error('Failed to save document');
      console.error(error);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Toolbar */}
      <EditorToolbar
        selectedObject={selectedObject}
        canvas={fabricRef.current}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onSave={handleSave}
        onExportPDF={handleExportPDF}
        onExportPNG={handleExportPNG}
        onClose={onClose}
        isDirty={isDirty}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Element Palette */}
        <ElementPalette
          isOpen={showElements}
          onToggle={() => setShowElements(!showElements)}
          onAddText={addText}
          onAddPlaceholder={addPlaceholder}
          onAddImage={addImage}
          onAddShape={addShape}
          onShowTemplates={() => setShowTemplates(true)}
        />

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-800 overflow-auto p-8">
          <div
            className="shadow-2xl"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right Panel - Sidebar */}
        <EditorSidebar
          documentData={documentData}
          selectedObject={selectedObject}
          canvasObjects={canvasObjects}
          onFieldChange={updateFieldValue}
          onSelectObject={(id) => {
            const canvas = fabricRef.current;
            if (!canvas) return;
            const obj = canvas.getObjects().find(o => o.id === id);
            if (obj) {
              canvas.setActiveObject(obj);
              canvas.renderAll();
            }
          }}
          onDeleteSelected={deleteSelected}
          onDuplicateSelected={duplicateSelected}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onAddField={(fieldId, label) => {
            setDocumentData(prev => ({
              ...prev,
              fields: {
                ...prev.fields,
                [fieldId]: { label, value: '', type: 'text' },
              },
            }));
          }}
        />
      </div>

      {/* Template Gallery Modal */}
      {showTemplates && (
        <TemplateGallery
          documentType={documentType}
          onSelect={loadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50">
          <div className="text-white text-xl">Loading editor...</div>
        </div>
      )}
    </div>
  );
};

export default WYSIWYGEditor;
