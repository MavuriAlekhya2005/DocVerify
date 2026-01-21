/**
 * Export Utilities for WYSIWYG Editor
 * Handles PDF and PNG export with proper rendering
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FabricImage } from 'fabric';

// A4 dimensions at 72 DPI
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

// Canvas dimensions (96 DPI)
const CANVAS_WIDTH = 794;
const CANVAS_HEIGHT = 1123;

/**
 * Export canvas to PDF
 */
export const exportToPDF = async (fabricCanvas, documentId) => {
  if (!fabricCanvas) throw new Error('Canvas not available');

  return new Promise((resolve, reject) => {
    try {
      // Get canvas as data URL at high resolution
      const multiplier = 2; // 2x resolution for better quality
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        multiplier,
        quality: 1,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      // Calculate dimensions to fit A4
      const imgWidth = A4_WIDTH;
      const imgHeight = (CANVAS_HEIGHT / CANVAS_WIDTH) * A4_WIDTH;

      // Add image to PDF
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');

      // Save PDF
      pdf.save(`${documentId || 'document'}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Export canvas to PNG
 */
export const exportToPNG = async (fabricCanvas, documentId) => {
  if (!fabricCanvas) throw new Error('Canvas not available');

  return new Promise((resolve, reject) => {
    try {
      // Get canvas as data URL at high resolution
      const multiplier = 2;
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        multiplier,
        quality: 1,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `${documentId || 'document'}.png`;
      link.href = dataUrl;
      link.click();

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Export canvas to base64 for storage
 */
export const exportToBase64 = (fabricCanvas, format = 'png') => {
  if (!fabricCanvas) return null;

  return fabricCanvas.toDataURL({
    format,
    multiplier: 1,
    quality: 0.8,
  });
};

/**
 * Generate QR code and add to canvas
 */
export const generateAndAddQRCode = async (fabricCanvas, data, position = {}) => {
  const QRCode = await import('qrcode');
  
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
    width: 150,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return new Promise((resolve) => {
    FabricImage.fromURL(qrDataUrl).then((img) => {
      img.set({
        left: position.left || CANVAS_WIDTH - 150,
        top: position.top || CANVAS_HEIGHT - 180,
        id: 'qr-code',
        name: 'QR Code',
        selectable: false,
        evented: false,
      });

      // Remove existing QR code if present
      const existingQR = fabricCanvas.getObjects().find(obj => obj.id === 'qr-code');
      if (existingQR) {
        fabricCanvas.remove(existingQR);
      }

      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      resolve(img);
    });
  });
};

/**
 * Prepare canvas for final export (replace placeholders, add QR, etc.)
 */
export const prepareForExport = async (fabricCanvas, documentData, verifyUrl) => {
  if (!fabricCanvas) return;

  // Replace placeholders with actual values
  fabricCanvas.getObjects().forEach(obj => {
    if (obj.isPlaceholder && obj.fieldId) {
      const fieldValue = documentData.fields?.[obj.fieldId]?.value;
      if (fieldValue) {
        obj.set('text', fieldValue);
      }
    }
  });

  // Add QR code if verify URL is provided
  if (verifyUrl) {
    await generateAndAddQRCode(fabricCanvas, {
      id: documentData.id,
      url: verifyUrl,
    });
  }

  fabricCanvas.renderAll();
};

/**
 * Create thumbnail of canvas
 */
export const createThumbnail = (fabricCanvas, width = 200) => {
  if (!fabricCanvas) return null;

  const aspectRatio = CANVAS_HEIGHT / CANVAS_WIDTH;
  const height = width * aspectRatio;
  const multiplier = width / CANVAS_WIDTH;

  return fabricCanvas.toDataURL({
    format: 'jpeg',
    multiplier,
    quality: 0.6,
  });
};
