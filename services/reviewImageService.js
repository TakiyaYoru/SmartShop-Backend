import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { storage, STORAGE_CONFIG } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Upload review image to Firebase Storage
 * @param {File} file - File object từ GraphQL upload
 * @param {string} reviewId - ID của review (optional, có thể là temp ID)
 * @returns {Promise<{success: boolean, filename: string, url: string, message: string}>}
 */
export const uploadReviewImage = async (file, reviewId = null) => {
  try {
    console.log('🔄 Starting review image upload...');
    
    // Validate file
    const originalName = file.name;
    const fileExtension = path.extname(originalName).toLowerCase();
    
    if (!STORAGE_CONFIG.allowedTypes.includes(fileExtension)) {
      throw new Error(`Invalid file type. Allowed types: ${STORAGE_CONFIG.allowedTypes.join(', ')}`);
    }
    
    // Get file buffer
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // Validate file size (max 5MB for review images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxSize) {
      throw new Error(`File too large. Max size: 5MB`);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = reviewId 
      ? `review_${reviewId}_${timestamp}_${uuidv4()}${fileExtension}`
      : `review_temp_${timestamp}_${uuidv4()}${fileExtension}`;
    
    const filePath = `${STORAGE_CONFIG.reviewImagesPath}${filename}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    console.log(`📤 Uploading review image to path: ${filePath}`);
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type || 'image/jpeg'
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Review image upload successful!');
    console.log('📁 File path:', filePath);
    console.log('🔗 Download URL:', downloadURL);
    
    return {
      success: true,
      filename: filename,
      url: downloadURL,
      path: filePath,
      message: 'Review image uploaded successfully'
    };
    
  } catch (error) {
    console.error('❌ Review image upload error:', error);
    return {
      success: false,
      filename: null,
      url: null,
      path: null,
      message: `Upload failed: ${error.message}`
    };
  }
};

/**
 * Upload multiple review images
 * @param {File[]} files - Array of file objects
 * @param {string} reviewId - ID của review (optional)
 * @returns {Promise<{success: boolean, uploadedFiles: Array, errors: Array, message: string}>}
 */
export const uploadReviewImages = async (files, reviewId = null) => {
  const uploadedFiles = [];
  const errors = [];
  
  console.log(`🖼️ Uploading ${files.length} review images`);
  
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const result = await uploadReviewImage(file, reviewId);
      
      if (result.success) {
        uploadedFiles.push({
          filename: result.filename,
          url: result.url,
          path: result.path
        });
        console.log(`✅ Review image ${i + 1}/${files.length} uploaded: ${result.filename}`);
      } else {
        errors.push(`Image ${i + 1}: ${result.message}`);
        console.error(`❌ Review image ${i + 1} failed:`, result.message);
      }
      
    } catch (error) {
      const errorMsg = `Image ${i + 1}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ Review image ${i + 1} error:`, error);
    }
  }
  
  const success = uploadedFiles.length > 0;
  const message = success 
    ? `${uploadedFiles.length} image(s) uploaded successfully${errors.length > 0 ? `. Errors: ${errors.join('; ')}` : ''}`
    : `Upload failed. Errors: ${errors.join('; ')}`;
  
  return {
    success,
    uploadedFiles,
    errors,
    message
  };
};

/**
 * Delete review image from Firebase Storage
 * @param {string} filename - Tên file cần xóa
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteReviewImage = async (filename) => {
  try {
    console.log(`🗑️ Deleting review image: ${filename}`);
    
    const filePath = `${STORAGE_CONFIG.reviewImagesPath}${filename}`;
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    console.log('✅ Review image deleted successfully');
    return {
      success: true,
      message: 'Review image deleted successfully'
    };
    
  } catch (error) {
    console.error('❌ Delete review image error:', error);
    return {
      success: false,
      message: `Delete failed: ${error.message}`
    };
  }
};

/**
 * Delete multiple review images
 * @param {string[]} filenames - Array of filenames to delete
 * @returns {Promise<{success: boolean, deletedCount: number, errors: Array, message: string}>}
 */
export const deleteReviewImages = async (filenames) => {
  const errors = [];
  let deletedCount = 0;
  
  console.log(`🗑️ Deleting ${filenames.length} review images`);
  
  for (const filename of filenames) {
    try {
      const result = await deleteReviewImage(filename);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`${filename}: ${result.message}`);
      }
    } catch (error) {
      errors.push(`${filename}: ${error.message}`);
    }
  }
  
  const success = deletedCount > 0;
  const message = success 
    ? `${deletedCount} image(s) deleted successfully${errors.length > 0 ? `. Errors: ${errors.join('; ')}` : ''}`
    : `Delete failed. Errors: ${errors.join('; ')}`;
  
  return {
    success,
    deletedCount,
    errors,
    message
  };
}; 