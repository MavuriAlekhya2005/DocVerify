/**
 * Editor Sidebar Component
 * Right panel showing document fields, layer management, and object properties
 */

import { useState } from 'react';
import {
  HiDocumentText,
  HiCollection,
  HiAdjustments,
  HiPlus,
  HiTrash,
  HiDuplicate,
  HiArrowUp,
  HiArrowDown,
  HiEye,
  HiEyeOff,
  HiLockClosed,
  HiLockOpen,
  HiPencil,
} from 'react-icons/hi';

const EditorSidebar = ({
  documentData,
  selectedObject,
  canvasObjects,
  onFieldChange,
  onSelectObject,
  onDeleteSelected,
  onDuplicateSelected,
  onBringForward,
  onSendBackward,
  onAddField,
}) => {
  const [activeTab, setActiveTab] = useState('fields');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  const tabs = [
    { id: 'fields', label: 'Fields', icon: HiDocumentText },
    { id: 'layers', label: 'Layers', icon: HiCollection },
    { id: 'properties', label: 'Properties', icon: HiAdjustments },
  ];

  const handleAddField = () => {
    if (newFieldName && newFieldLabel) {
      onAddField(newFieldName, newFieldLabel);
      setNewFieldName('');
      setNewFieldLabel('');
      setShowAddField(false);
    }
  };

  const renderFieldsTab = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Document Fields</h3>
        <button
          onClick={() => setShowAddField(!showAddField)}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
          title="Add Field"
        >
          <HiPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Field Form */}
      {showAddField && (
        <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Field ID (e.g., studentName)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value.replace(/\s/g, ''))}
            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <input
            type="text"
            placeholder="Label (e.g., Student Name)"
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddField}
              className="flex-1 bg-accent-500 hover:bg-accent-600 text-white text-sm py-1.5 rounded transition"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddField(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm py-1.5 rounded transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Field List */}
      <div className="space-y-2">
        {Object.entries(documentData.fields || {}).map(([fieldId, field]) => (
          <div key={fieldId} className="bg-gray-700/50 rounded-lg p-3">
            <label className="block text-xs text-gray-400 mb-1">
              {field.label || fieldId}
              <span className="text-gray-600 ml-1">({`{{${fieldId}}}`})</span>
            </label>
            <input
              type="text"
              value={field.value || ''}
              onChange={(e) => onFieldChange(fieldId, e.target.value)}
              placeholder={`Enter ${field.label || fieldId}`}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
        ))}

        {Object.keys(documentData.fields || {}).length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No fields defined yet.<br />
            Add fields or use placeholders on canvas.
          </p>
        )}
      </div>

      {/* Document Info */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Document Info</h4>
        <div className="space-y-1 text-xs text-gray-500">
          <p>ID: <span className="text-gray-400 font-mono">{documentData.id?.slice(0, 8)}...</span></p>
          <p>Type: <span className="text-gray-400">{documentData.type}</span></p>
          <p>Created: <span className="text-gray-400">{new Date(documentData.createdAt).toLocaleDateString()}</span></p>
        </div>
      </div>
    </div>
  );

  const renderLayersTab = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Layers</h3>
        <span className="text-xs text-gray-500">{canvasObjects.length} objects</span>
      </div>

      {/* Layer Actions */}
      {selectedObject && (
        <div className="flex gap-1 bg-gray-700/50 rounded-lg p-2">
          <button
            onClick={onBringForward}
            className="flex-1 p-2 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
            title="Bring Forward"
          >
            <HiArrowUp className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={onSendBackward}
            className="flex-1 p-2 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
            title="Send Backward"
          >
            <HiArrowDown className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={onDuplicateSelected}
            className="flex-1 p-2 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
            title="Duplicate"
          >
            <HiDuplicate className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={onDeleteSelected}
            className="flex-1 p-2 hover:bg-red-600 rounded text-gray-400 hover:text-white transition"
            title="Delete"
          >
            <HiTrash className="w-4 h-4 mx-auto" />
          </button>
        </div>
      )}

      {/* Layer List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {[...canvasObjects].reverse().map((obj) => (
          <div
            key={obj.id}
            onClick={() => onSelectObject(obj.id)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
              selectedObject?.id === obj.id
                ? 'bg-accent-500/20 border border-accent-500/50'
                : 'hover:bg-gray-700/50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate">{obj.name}</p>
              <p className="text-xs text-gray-500">{obj.type}</p>
            </div>
            <div className="flex items-center gap-1">
              {obj.locked && (
                <HiLockClosed className="w-3 h-3 text-gray-500" />
              )}
              {!obj.visible && (
                <HiEyeOff className="w-3 h-3 text-gray-500" />
              )}
            </div>
          </div>
        ))}

        {canvasObjects.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No objects on canvas
          </p>
        )}
      </div>
    </div>
  );

  const renderPropertiesTab = () => (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Object Properties</h3>

      {selectedObject ? (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Type</span>
              <span className="text-sm text-gray-300 capitalize">{selectedObject.type}</span>
            </div>
            {selectedObject.name && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Name</span>
                <span className="text-sm text-gray-300">{selectedObject.name}</span>
              </div>
            )}
            {selectedObject.fieldId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Field ID</span>
                <span className="text-sm text-accent-400 font-mono">{selectedObject.fieldId}</span>
              </div>
            )}
          </div>

          {/* Position */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">X</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.left || 0)}
                  readOnly
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.top || 0)}
                  readOnly
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Size</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Width</label>
                <input
                  type="number"
                  value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
                  readOnly
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Height</label>
                <input
                  type="number"
                  value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
                  readOnly
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Rotation</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={Math.round(selectedObject.angle || 0)}
                readOnly
                className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1"
              />
              <span className="text-gray-500 text-sm">°</span>
            </div>
          </div>

          {/* Opacity */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Opacity</h4>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((selectedObject.opacity || 1) * 100)}
              readOnly
              className="w-full"
            />
            <span className="text-sm text-gray-400">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">
          Select an object to view its properties
        </p>
      )}
    </div>
  );

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition ${
              activeTab === tab.id
                ? 'text-accent-400 border-b-2 border-accent-400 bg-gray-700/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'fields' && renderFieldsTab()}
        {activeTab === 'layers' && renderLayersTab()}
        {activeTab === 'properties' && renderPropertiesTab()}
      </div>
    </div>
  );
};

export default EditorSidebar;
