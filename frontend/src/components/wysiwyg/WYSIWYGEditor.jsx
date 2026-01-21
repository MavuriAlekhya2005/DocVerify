/**
 * WYSIWYG Document Editor Component
 * Uses Fabric.js for canvas manipulation
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  HiPlus, HiTrash, HiDuplicate, HiSave, HiDownload,
  HiZoomIn, HiZoomOut, HiArrowUp, HiArrowDown,
  HiPhotograph, HiTemplate
} from 'react-icons/hi';

const WYSIWYGEditor = ({ template, documentType, onSave, onExport }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [zoom, setZoom] = useState(0.75);
  const [layers, setLayers] = useState([]);

  // Canvas dimensions based on document type
  const getCanvasSize = () => {
    if (template?.layout === 'landscape') return { width: 1000, height: 700 };
    if (template?.layout === 'horizontal') return { width: 450, height: 280 };
    if (template?.layout === 'vertical') return { width: 280, height: 450 };
    return { width: 700, height: 1000 }; // Portrait default
  };

  const size = getCanvasSize();

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
    fabricCanvas.on('object:added', () => refreshLayers(fabricCanvas));
    fabricCanvas.on('object:removed', () => refreshLayers(fabricCanvas));
    fabricCanvas.on('object:modified', () => refreshLayers(fabricCanvas));

    setCanvas(fabricCanvas);

    // Apply template
    if (template) {
      setTimeout(() => applyTemplate(fabricCanvas, template), 100);
    }

    return () => fabricCanvas.dispose();
  }, []);

  const refreshLayers = (c) => {
    if (!c) return;
    const objs = c.getObjects();
    setLayers(objs.map((obj, i) => ({
      id: i,
      name: obj.customName || obj.type || 'Object',
      type: obj.type,
    })));
  };

  // Apply template design to canvas
  const applyTemplate = (c, tmpl) => {
    if (!c || !tmpl) return;

    const colors = tmpl.colors || { primary: '#1e3a5f', secondary: '#c9a227', accent: '#fef3c7', text: '#1e293b' };
    const { width, height } = size;

    // Background
    c.backgroundColor = colors.accent || '#ffffff';

    // Border frame
    const border = new fabric.Rect({
      left: 20,
      top: 20,
      width: width - 40,
      height: height - 40,
      fill: 'transparent',
      stroke: colors.secondary,
      strokeWidth: 3,
      selectable: false,
      customName: 'Border',
    });
    c.add(border);

    // Inner border
    const innerBorder = new fabric.Rect({
      left: 30,
      top: 30,
      width: width - 60,
      height: height - 60,
      fill: 'transparent',
      stroke: colors.primary,
      strokeWidth: 1,
      selectable: false,
      customName: 'Inner Border',
    });
    c.add(innerBorder);

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

  // Object actions
  const deleteObject = () => {
    if (!canvas || !activeObject) return;
    canvas.remove(activeObject);
    setActiveObject(null);
    canvas.renderAll();
  };

  const duplicateObject = () => {
    if (!canvas || !activeObject) return;
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
    const json = canvas.toJSON(['customName']);
    const preview = canvas.toDataURL({ format: 'png', quality: 1 });
    onSave?.({ canvasData: json, preview });
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

  return (
    <div className="h-full flex bg-gray-100">
      {/* Left Sidebar - Elements */}
      <div className="w-56 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Add Elements</h3>
        
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
              className={`p-2 text-xs rounded cursor-pointer truncate ${
                activeObject === canvas?.getObjects()[layers.length - 1 - idx]
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
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
                <button onClick={duplicateObject} className="p-1.5 hover:bg-gray-100 rounded" title="Duplicate">
                  <HiDuplicate className="w-4 h-4" />
                </button>
                <button onClick={deleteObject} className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="Delete">
                  <HiTrash className="w-4 h-4" />
                </button>
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

            {/* Rotation */}
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

            {/* Color */}
            {activeObject.fill !== undefined && activeObject.type !== 'line' && (
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
            {(activeObject.type === 'i-text' || activeObject.type === 'text') && (
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
                <div className="flex gap-1">
                  <button
                    onClick={() => updateProperty('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`flex-1 p-1.5 rounded border text-sm ${activeObject.fontWeight === 'bold' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => updateProperty('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`flex-1 p-1.5 rounded border text-sm italic ${activeObject.fontStyle === 'italic' ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}`}
                  >
                    I
                  </button>
                </div>
              </>
            )}

            {/* Opacity */}
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
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            Select an element to edit
          </p>
        )}

        {/* Template Info */}
        {template && (
          <div className="mt-6 pt-4 border-t border-gray-200">
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
