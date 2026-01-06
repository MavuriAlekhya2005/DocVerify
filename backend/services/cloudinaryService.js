const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from URL
// URL format: cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  // Parse the URL manually for more control
  const matches = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (matches) {
    cloudinary.config({
      cloud_name: matches[3],
      api_key: matches[1],
      api_secret: matches[2],
      secure: true,
    });
    console.log('Cloudinary configured successfully for cloud:', matches[3]);
  } else {
    console.error('Invalid CLOUDINARY_URL format');
  }
} else {
  console.warn('CLOUDINARY_URL not set, using local storage');
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with secure_url, public_id, etc.
 */
const uploadToCloudinary = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'docverify/documents',
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to upload
    const Readable = require('stream').Readable;
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload a file from path to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
const uploadFileToCloudinary = async (filePath, options = {}) => {
  const uploadOptions = {
    folder: options.folder || 'docverify/documents',
    resource_type: options.resource_type || 'auto',
    public_id: options.public_id,
    ...options,
  };

  try {
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary file upload error:', error);
    throw error;
  }
};

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64String - Base64 encoded image string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
const uploadBase64ToCloudinary = async (base64String, options = {}) => {
  const uploadOptions = {
    folder: options.folder || 'docverify/documents',
    resource_type: 'image',
    public_id: options.public_id,
    ...options,
  };

  try {
    const result = await cloudinary.uploader.upload(base64String, uploadOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public_id of the file to delete
 * @param {Object} options - Delete options
 * @returns {Promise<Object>} - Delete result
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Generate a signed URL for secure access
 * @param {string} publicId - The public_id of the file
 * @param {Object} options - URL generation options
 * @returns {string} - Signed URL
 */
const getSignedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    ...options,
  };

  return cloudinary.url(publicId, defaultOptions);
};

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
  return !!cloudinaryUrl && !!cloudinary.config().cloud_name;
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadFileToCloudinary,
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  getSignedUrl,
  isCloudinaryConfigured,
};
