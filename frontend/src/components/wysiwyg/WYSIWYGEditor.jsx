/**
 * WYSIWYG Document Editor Component
 * Uses Fabric.js for canvas manipulation
 * Features: Undo/Redo, Auto-embedded QR code and Document ID (locked)
 * Keyboard Shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), Delete (remove), Ctrl+D (duplicate)
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';
import {
  HiPlus, HiTrash, HiDuplicate, HiSave, HiDownload,
  HiZoomIn, HiZoomOut, HiArrowUp, HiArrowDown,
  HiPhotograph, HiTemplate, HiReply, HiRefresh,
  HiQrcode, HiLockClosed, HiMenuAlt2
} from 'react-icons/hi';

const WYSIWYGEditor = ({ template, documentType, documentId, onSave, onExport }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [zoom, setZoom] = useState(0.75);
  const [layers, setLayers] = useState([]);
  const [codeType, setCodeType] = useState('qr'); // 'qr' or 'barcode'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  // Canvas dimensions based on document type
  const getCanvasSize = () => {
    if (template?.layout === 'landscape') return { width: 1000, height: 700 };
    if (template?.layout === 'horizontal') return { width: 450, height: 280 };
    if (template?.layout === 'vertical') return { width: 280, height: 450 };
    return { width: 700, height: 1000 }; // Portrait default
  };

  const size = getCanvasSize();

  // Save canvas state for undo/redo
  const saveHistory = useCallback((c) => {
    if (!c || isUndoRedo.current) return;
    
    const json = c.toJSON(['customName', 'isLocked', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hasControls', 'evented']);
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(json));
      // Keep last 30 states
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0 || !canvas) return;
    
    isUndoRedo.current = true;
    const newIndex = historyIndex - 1;
    const state = JSON.parse(history[newIndex]);
    
    canvas.loadFromJSON(state).then(() => {
      canvas.renderAll();
      refreshLayers(canvas);
      setHistoryIndex(newIndex);
      isUndoRedo.current = false;
    });
  }, [canvas, history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !canvas) return;
    
    isUndoRedo.current = true;
    const newIndex = historyIndex + 1;
    const state = JSON.parse(history[newIndex]);
    
    canvas.loadFromJSON(state).then(() => {
      canvas.renderAll();
      refreshLayers(canvas);
      setHistoryIndex(newIndex);
      isUndoRedo.current = false;
    });
  }, [canvas, history, historyIndex]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: size.width,
      height: size.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    // Selection events
    fabricCanvas.on('selection:created', (e) => setActiveObject(e.selected?.[0] || null));
    fabricCanvas.on('selection:updated', (e) => setActiveObject(e.selected?.[0] || null));
    fabricCanvas.on('selection:cleared', () => setActiveObject(null));
    fabricCanvas.on('object:added', () => {
      refreshLayers(fabricCanvas);
      saveHistory(fabricCanvas);
    });
    fabricCanvas.on('object:removed', () => {
      refreshLayers(fabricCanvas);
      saveHistory(fabricCanvas);
    });
    fabricCanvas.on('object:modified', () => {
      refreshLayers(fabricCanvas);
      saveHistory(fabricCanvas);
    });

    setCanvas(fabricCanvas);

    // Apply template and add locked elements
    if (template) {
      setTimeout(() => {
        applyTemplate(fabricCanvas, template);
        addLockedElements(fabricCanvas);
        saveHistory(fabricCanvas);
      }, 100);
    } else {
      setTimeout(() => {
        addLockedElements(fabricCanvas);
        saveHistory(fabricCanvas);
      }, 100);
    }

    return () => fabricCanvas.dispose();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = (e) => {
      // Check if we're typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        toast.success('Undo', { duration: 1000, icon: '↩️' });
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
        toast.success('Redo', { duration: 1000, icon: '↪️' });
      }
      
      // Delete or Backspace - Remove selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeObject) {
        e.preventDefault();
        if (!activeObject.isLocked) {
          canvas.remove(activeObject);
          setActiveObject(null);
          canvas.renderAll();
          toast.success('Element deleted', { duration: 1000 });
        } else {
          toast.error('Cannot delete locked elements', { duration: 2000 });
        }
      }
      
      // Ctrl+D - Duplicate selected object
      if (e.ctrlKey && e.key === 'd' && activeObject) {
        e.preventDefault();
        if (!activeObject.isLocked) {
          activeObject.clone().then((cloned) => {
            cloned.set({
              left: activeObject.left + 20,
              top: activeObject.top + 20,
              isLocked: false,
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            toast.success('Element duplicated', { duration: 1000 });
          });
        } else {
          toast.error('Cannot duplicate locked elements', { duration: 2000 });
        }
      }
      
      // Escape - Deselect
      if (e.key === 'Escape') {
        canvas.discardActiveObject();
        canvas.renderAll();
        setActiveObject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, activeObject, undo, redo]);

  // Add QR/Barcode and Document ID (locked, non-deletable)
  const addLockedElements = async (c) => {
    if (!c || !documentId) return;
    
    const { width, height } = size;
    
    // Generate QR code
    try {
      const qrDataUrl = await QRCode.toDataURL(
        JSON.stringify({ 
          documentId, 
          url: `${window.location.origin}/verify/${documentId}` 
        }),
        { width: 100, margin: 1 }
      );
      
      // Add QR Code image
      fabric.FabricImage.fromURL(qrDataUrl).then((qrImg) => {
        qrImg.set({
          left: width - 130,
          top: height - 130,
          scaleX: 1,
          scaleY: 1,
          customName: 'QR Code',
          isLocked: true,
          lockRotation: true,
          hasControls: true,
          evented: true,
          // Allow move and resize only
          cornerStyle: 'circle',
          cornerColor: '#3b82f6',
          cornerSize: 8,
          transparentCorners: false,
        });
        c.add(qrImg);
        c.renderAll();
      });
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
    
    // Add Document ID text
    const docIdText = new fabric.IText(`ID: ${documentId}`, {
      left: width - 130,
      top: height - 25,
      fontSize: 10,
      fontFamily: 'monospace',
      fill: '#64748b',
      customName: 'Document ID',
      isLocked: true,
      lockRotation: true,
      editable: false,
      hasControls: true,
      evented: true,
      cornerStyle: 'circle',
      cornerColor: '#3b82f6',
      cornerSize: 8,
      transparentCorners: false,
    });
    c.add(docIdText);
    c.renderAll();
  };

  // Switch between QR and Barcode
  const switchCodeType = async () => {
    if (!canvas || !documentId) return;
    
    // Remove existing code
    const objects = canvas.getObjects();
    const codeObj = objects.find(obj => obj.customName === 'QR Code' || obj.customName === 'Barcode');
    if (codeObj) canvas.remove(codeObj);
    
    const { width, height } = size;
    const newType = codeType === 'qr' ? 'barcode' : 'qr';
    
    if (newType === 'qr') {
      try {
        const qrDataUrl = await QRCode.toDataURL(
          JSON.stringify({ documentId, url: `${window.location.origin}/verify/${documentId}` }),
          { width: 100, margin: 1 }
        );
        
        fabric.FabricImage.fromURL(qrDataUrl).then((qrImg) => {
          qrImg.set({
            left: width - 130,
            top: height - 130,
            scaleX: 1,
            scaleY: 1,
            customName: 'QR Code',
            isLocked: true,
            lockRotation: true,
            hasControls: true,
            evented: true,
            cornerStyle: 'circle',
            cornerColor: '#3b82f6',
            cornerSize: 8,
            transparentCorners: false,
          });
          canvas.add(qrImg);
          canvas.renderAll();
        });
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    } else {
      // Generate barcode
      try {
        const barcodeCanvas = document.createElement('canvas');
        JsBarcode(barcodeCanvas, documentId, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 2,
        });
        
        fabric.FabricImage.fromURL(barcodeCanvas.toDataURL()).then((barcodeImg) => {
          barcodeImg.set({
            left: width - 150,
            top: height - 100,
            scaleX: 0.8,
            scaleY: 0.8,
            customName: 'Barcode',
            isLocked: true,
            lockRotation: true,
            hasControls: true,
            evented: true,
            cornerStyle: 'circle',
            cornerColor: '#3b82f6',
            cornerSize: 8,
            transparentCorners: false,
          });
          canvas.add(barcodeImg);
          canvas.renderAll();
        });
      } catch (err) {
        console.error('Failed to generate barcode:', err);
      }
    }
    
    setCodeType(newType);
  };

  const refreshLayers = (c) => {
    if (!c) return;
    const objs = c.getObjects();
    setLayers(objs.map((obj, i) => ({
      id: i,
      name: obj.customName || obj.type || 'Object',
      type: obj.type,
      isLocked: obj.isLocked,
    })));
  };

  // Apply template design to canvas
  const applyTemplate = (c, tmpl) => {
    if (!c || !tmpl) return;

    const colors = tmpl.colors || { primary: '#1e3a5f', secondary: '#c9a227', accent: '#fef3c7', text: '#1e293b' };
    const { width, height } = size;

    // Background
    c.backgroundColor = colors.accent || '#ffffff';

    // Header decoration
    if (tmpl.style === 'modern' || tmpl.style === 'corporate' || tmpl.style === 'tech') {
      const header = new fabric.Rect({
        left: 0,
        top: 0,
        width: width,
        height: 100,
        fill: colors.primary,
        selectable: false,
        customName: 'Header',
      });
      c.add(header);
    }

    // Title
    const title = new fabric.IText('CERTIFICATE', {
      left: width / 2,
      top: tmpl.style === 'modern' ? 40 : 80,
      originX: 'center',
      fontSize: 42,
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fill: tmpl.style === 'modern' ? '#ffffff' : colors.primary,
      customName: 'Title',
    });
    c.add(title);

    // Subtitle
    const subtitle = new fabric.IText('of Achievement', {
      left: width / 2,
      top: title.top + 50,
      originX: 'center',
      fontSize: 24,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      fill: colors.secondary,
      customName: 'Subtitle',
    });
    c.add(subtitle);

    // "This is to certify that"
    const certifyText = new fabric.IText('This is to certify that', {
      left: width / 2,
      top: subtitle.top + 60,
      originX: 'center',
      fontSize: 14,
      fontFamily: 'Georgia, serif',
      fill: colors.text,
      customName: 'Certify Text',
    });
    c.add(certifyText);

    // Recipient Name Placeholder
    const recipientName = new fabric.IText('Recipient Name', {
      left: width / 2,
      top: certifyText.top + 40,
      originX: 'center',
      fontSize: 32,
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fill: colors.primary,
      customName: 'Recipient Name',
    });
    c.add(recipientName);

    // Underline
    const underline = new fabric.Line([width / 2 - 150, recipientName.top + 45, width / 2 + 150, recipientName.top + 45], {
      stroke: colors.secondary,
      strokeWidth: 2,
      selectable: false,
      customName: 'Underline',
    });
    c.add(underline);

    // "has successfully completed"
    const completedText = new fabric.IText('has successfully completed', {
      left: width / 2,
      top: underline.top + 20,
      originX: 'center',
      fontSize: 14,
      fontFamily: 'Georgia, serif',
      fill: colors.text,
      customName: 'Completed Text',
    });
    c.add(completedText);

    // Course Name Placeholder
    const courseName = new fabric.IText('Course Name', {
      left: width / 2,
      top: completedText.top + 35,
      originX: 'center',
      fontSize: 22,
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fill: colors.primary,
      customName: 'Course Name',
    });
    c.add(courseName);

    // Date
    const dateText = new fabric.IText('Date: _______________', {
      left: 80,
      top: height - 100,
      fontSize: 12,
      fontFamily: 'Georgia, serif',
      fill: colors.text,
      customName: 'Date',
    });
    c.add(dateText);

    // Signature
    const signatureText = new fabric.IText('Signature: _______________', {
      left: width - 220,
      top: height - 100,
      fontSize: 12,
      fontFamily: 'Georgia, serif',
      fill: colors.text,
      customName: 'Signature',
    });
    c.add(signatureText);

    c.renderAll();
    refreshLayers(c);
  };

  // Add elements
  const addText = (type) => {
    if (!canvas) return;
    const configs = {
      heading: { text: 'Heading', fontSize: 28, fontWeight: 'bold' },
      body: { text: 'Body text here', fontSize: 14, fontWeight: 'normal' },
    };
    const cfg = configs[type] || configs.body;
    const text = new fabric.IText(cfg.text, {
      left: size.width / 2,
      top: size.height / 2,
      originX: 'center',
      fontSize: cfg.fontSize,
      fontWeight: cfg.fontWeight,
      fontFamily: 'Georgia, serif',
      fill: template?.colors?.text || '#1e293b',
      customName: type === 'heading' ? 'Heading' : 'Text',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addShape = (type) => {
    if (!canvas) return;
    const colors = template?.colors || { primary: '#3b82f6', secondary: '#1e40af' };
    let shape;
    
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: size.width / 2 - 50,
        top: size.height / 2 - 30,
        width: 100,
        height: 60,
        fill: colors.primary,
        rx: 4,
        ry: 4,
        customName: 'Rectangle',
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: size.width / 2 - 30,
        top: size.height / 2 - 30,
        radius: 30,
        fill: colors.secondary,
        customName: 'Circle',
      });
    } else if (type === 'line') {
      shape = new fabric.Line([size.width / 2 - 50, size.height / 2, size.width / 2 + 50, size.height / 2], {
        stroke: colors.primary,
        strokeWidth: 2,
        customName: 'Line',
      });
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        fabric.FabricImage.fromURL(evt.target.result).then((img) => {
          img.scaleToWidth(150);
          img.set({ left: 50, top: 50, customName: 'Image' });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Object actions - with protection for locked elements
  const deleteObject = () => {
    if (!canvas || !activeObject) return;
    
    // Check if object is locked (QR Code, Barcode, Document ID)
    if (activeObject.isLocked) {
      return; // Can't delete locked elements
    }
    
    canvas.remove(activeObject);
    setActiveObject(null);
    canvas.renderAll();
  };

  const duplicateObject = () => {
    if (!canvas || !activeObject) return;
    
    // Don't allow duplicating locked elements
    if (activeObject.isLocked) return;
    
    activeObject.clone().then((cloned) => {
      cloned.set({ left: activeObject.left + 20, top: activeObject.top + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  const bringForward = () => {
    if (!canvas || !activeObject) return;
    canvas.bringObjectForward(activeObject);
    canvas.renderAll();
    refreshLayers(canvas);
  };

  const sendBackward = () => {
    if (!canvas || !activeObject) return;
    canvas.sendObjectBackwards(activeObject);
    canvas.renderAll();
    refreshLayers(canvas);
  };

  // Zoom
  const handleZoom = (delta) => {
    setZoom((z) => Math.max(0.25, Math.min(2, z + delta)));
  };

  // Save & Export
  const handleSave = () => {
    if (!canvas) return;
    const json = canvas.toJSON(['customName', 'isLocked']);
    const preview = canvas.toDataURL({ format: 'png', quality: 1 });
    onSave?.({ canvasData: json, preview, codeType });
  };

  const handleExport = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    onExport?.('png', dataUrl);
  };

  // Property updates
  const updateProperty = (prop, value) => {
    if (!activeObject || !canvas) return;
    activeObject.set(prop, value);
    canvas.renderAll();
  };

  // Check if active object is locked
  const isActiveLocked = activeObject?.isLocked;

  return (
    <div className="h-full flex bg-gray-100">
      {/* Sidebar Toggle Button (visible when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-2 top-20 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50"
          title="Show Sidebar"
        >
          <HiMenuAlt2 className="w-5 h-5" />
        </button>
      )}

      {/* Left Sidebar - Elements */}
      <div className={`${sidebarCollapsed ? 'hidden' : 'w-56'} bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0 transition-all`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">Add Elements</h3>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Collapse Sidebar"
          >
            <HiMenuAlt2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Text */}
        <div className="space-y-2 mb-6">
          <button
            onClick={() => addText('heading')}
            className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded border border-gray-200 transition-colors"
          >
            + Heading
          </button>
          <button
            onClick={() => addText('body')}
            className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded border border-gray-200 transition-colors"
          >
            + Body Text
          </button>
        </div>

        {/* Shapes */}
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Shapes</h3>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button onClick={() => addShape('rect')} className="p-3 bg-gray-50 hover:bg-blue-50 rounded border border-gray-200">
            <div className="w-6 h-4 bg-blue-500 rounded-sm mx-auto" />
          </button>
          <button onClick={() => addShape('circle')} className="p-3 bg-gray-50 hover:bg-blue-50 rounded border border-gray-200">
            <div className="w-5 h-5 bg-blue-500 rounded-full mx-auto" />
          </button>
          <button onClick={() => addShape('line')} className="p-3 bg-gray-50 hover:bg-blue-50 rounded border border-gray-200">
            <div className="w-6 h-0.5 bg-blue-500 mx-auto" />
          </button>
        </div>

        {/* Image */}
        <button
          onClick={addImage}
          className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded border border-gray-200 transition-colors flex items-center gap-2"
        >
          <HiPhotograph className="w-4 h-4" />
          Upload Image
        </button>

        {/* Code Type Switcher */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Verification Code</h3>
          <button
            onClick={switchCodeType}
            className="w-full p-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded border border-gray-200 transition-colors flex items-center gap-2"
          >
            <HiQrcode className="w-4 h-4" />
            Switch to {codeType === 'qr' ? 'Barcode' : 'QR Code'}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Current: {codeType === 'qr' ? 'QR Code' : 'Barcode'}
          </p>
        </div>

        {/* Layers */}
        <h3 className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-3">Layers ({layers.length})</h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {[...layers].reverse().map((layer, idx) => (
            <div
              key={layer.id}
              onClick={() => {
                const obj = canvas?.getObjects()[layers.length - 1 - idx];
                if (obj && canvas) {
                  canvas.setActiveObject(obj);
                  canvas.renderAll();
                }
              }}
              className={`p-2 text-xs rounded cursor-pointer truncate flex items-center gap-1 ${
                activeObject === canvas?.getObjects()[layers.length - 1 - idx]
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {layer.isLocked && <HiLockClosed className="w-3 h-3 text-amber-500" />}
              {layer.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button 
              onClick={undo} 
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded ${historyIndex <= 0 ? 'text-gray-300' : 'hover:bg-gray-100'}`}
              title="Undo (Ctrl+Z)"
            >
              <HiReply className="w-4 h-4" />
            </button>
            <button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded ${historyIndex >= history.length - 1 ? 'text-gray-300' : 'hover:bg-gray-100'}`}
              title="Redo (Ctrl+Y)"
            >
              <HiReply className="w-4 h-4 transform scale-x-[-1]" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {/* Zoom */}
            <button onClick={() => handleZoom(-0.1)} className="p-1.5 hover:bg-gray-100 rounded">
              <HiZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm w-14 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} className="p-1.5 hover:bg-gray-100 rounded">
              <HiZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {/* Object Actions */}
            {activeObject && (
              <>
                {!isActiveLocked && (
                  <button onClick={duplicateObject} className="p-1.5 hover:bg-gray-100 rounded" title="Duplicate">
                    <HiDuplicate className="w-4 h-4" />
                  </button>
                )}
                {!isActiveLocked ? (
                  <button onClick={deleteObject} className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="Delete">
                    <HiTrash className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded flex items-center gap-1">
                    <HiLockClosed className="w-3 h-3" />
                    Locked
                  </span>
                )}
                <button onClick={bringForward} className="p-1.5 hover:bg-gray-100 rounded" title="Bring Forward">
                  <HiArrowUp className="w-4 h-4" />
                </button>
                <button onClick={sendBackward} className="p-1.5 hover:bg-gray-100 rounded" title="Send Backward">
                  <HiArrowDown className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <HiSave className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 flex items-center gap-1"
            >
              <HiDownload className="w-4 h-4" />
              Export PNG
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-8 bg-gray-200 flex items-start justify-center">
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="shadow-xl"
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-56 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Properties</h3>
        
        {activeObject ? (
          <div className="space-y-4">
            {/* Locked indicator */}
            {isActiveLocked && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-center gap-2">
                <HiLockClosed className="w-4 h-4" />
                This element cannot be deleted
              </div>
            )}

            {/* Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">X</label>
                <input
                  type="number"
                  value={Math.round(activeObject.left || 0)}
                  onChange={(e) => updateProperty('left', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  value={Math.round(activeObject.top || 0)}
                  onChange={(e) => updateProperty('top', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                />
              </div>
            </div>

            {/* Rotation - only if not locked */}
            {!isActiveLocked && (
              <div>
                <label className="text-xs text-gray-500">Rotation</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={activeObject.angle || 0}
                  onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{Math.round(activeObject.angle || 0)}°</span>
              </div>
            )}

            {/* Color */}
            {activeObject.fill !== undefined && activeObject.type !== 'line' && !isActiveLocked && (
              <div>
                <label className="text-xs text-gray-500">Fill Color</label>
                <input
                  type="color"
                  value={activeObject.fill || '#000000'}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Text Properties */}
            {(activeObject.type === 'i-text' || activeObject.type === 'text') && !isActiveLocked && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Font Size</label>
                  <input
                    type="number"
                    value={activeObject.fontSize || 16}
                    onChange={(e) => updateProperty('fontSize', parseInt(e.target.value) || 16)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                  />
                </div>
                
                {/* Font Family */}
                <div>
                  <label className="text-xs text-gray-500">Font Family</label>
                  <select
                    value={activeObject.fontFamily || 'Arial'}
                    onChange={(e) => updateProperty('fontFamily', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>

                {/* Text Styling: Bold, Italic, Underline */}
                <div className="flex gap-1">
                  <button
                    onClick={() => updateProperty('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`flex-1 p-1.5 rounded border text-sm font-bold ${activeObject.fontWeight === 'bold' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={() => updateProperty('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`flex-1 p-1.5 rounded border text-sm italic ${activeObject.fontStyle === 'italic' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onClick={() => updateProperty('underline', !activeObject.underline)}
                    className={`flex-1 p-1.5 rounded border text-sm underline ${activeObject.underline ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                    title="Underline"
                  >
                    U
                  </button>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="text-xs text-gray-500">Text Align</label>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => updateProperty('textAlign', 'left')}
                      className={`flex-1 p-1.5 rounded border text-xs ${activeObject.textAlign === 'left' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                      title="Align Left"
                    >
                      ⫷
                    </button>
                    <button
                      onClick={() => updateProperty('textAlign', 'center')}
                      className={`flex-1 p-1.5 rounded border text-xs ${activeObject.textAlign === 'center' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                      title="Align Center"
                    >
                      ☰
                    </button>
                    <button
                      onClick={() => updateProperty('textAlign', 'right')}
                      className={`flex-1 p-1.5 rounded border text-xs ${activeObject.textAlign === 'right' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                      title="Align Right"
                    >
                      ⫸
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Opacity */}
            {!isActiveLocked && (
              <div>
                <label className="text-xs text-gray-500">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={activeObject.opacity || 1}
                  onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            Select an element to edit
          </p>
        )}

        {/* Document Info */}
        {documentId && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Document</h3>
            <p className="text-xs font-mono text-gray-600 break-all">{documentId}</p>
          </div>
        )}

        {/* Template Info */}
        {template && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Template</h3>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded"
                style={{
                  background: `linear-gradient(135deg, ${template.colors?.primary} 0%, ${template.colors?.secondary} 100%)`,
                }}
              />
              <div>
                <p className="text-sm font-medium">{template.name}</p>
                <p className="text-xs text-gray-500 capitalize">{template.style}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WYSIWYGEditor;
