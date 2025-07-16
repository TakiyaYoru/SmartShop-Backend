// server/services/firebaseStorageService.js
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { storage, STORAGE_CONFIG } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Upload file to Firebase Storage
 * @param {File} file - File object từ GraphQL upload
 * @param {string} folder - Thư mục lưu trữ (ví dụ: 'products/images/')
 * @param {string} customName - Tên file tùy chỉnh (optional)
 * @returns {Promise<{success: boolean, filename: string, url: string, message: string}>}
 */
export const uploadFileToFirebase = async (file, folder = STORAGE_CONFIG.generalUploadsPath, customName = null) => {
  try {
    console.log('🔄 Starting Firebase upload...');
    
    // Validate file
    const originalName = file.name;
    const fileExtension = path.extname(originalName).toLowerCase();
    
    if (!STORAGE_CONFIG.allowedTypes.includes(fileExtension)) {
      throw new Error(`Invalid file type. Allowed types: ${STORAGE_CONFIG.allowedTypes.join(', ')}`);
    }
    
    // Get file buffer
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // Validate file size
    if (fileBuffer.length > STORAGE_CONFIG.maxFileSize) {
      throw new Error(`File too large. Max size: ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB`);
    }
    
    // Generate unique filename
    const filename = customName || `${uuidv4()}${fileExtension}`;
    const filePath = `${folder}${filename}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    console.log(`📤 Uploading to path: ${filePath}`);
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type || 'image/jpeg'
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Upload successful!');
    console.log('📁 File path:', filePath);
    console.log('🔗 Download URL:', downloadURL);
    
    return {
      success: true,
      filename: filename,
      url: downloadURL,
      path: filePath,
      message: 'File uploaded successfully'
    };
    
  } catch (error) {
    console.error('❌ Firebase upload error:', error);
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
 * Upload single product image
 * @param {string} productId - ID của sản phẩm
 * @param {File} file - File object
 * @returns {Promise<{success: boolean, filename: string, url: string, message: string}>}
 */
export const uploadProductImage = async (productId, file) => {
  const timestamp = Date.now();
  const fileExtension = path.extname(file.name).toLowerCase();
  const customFilename = `product_${productId}_${timestamp}_${uuidv4()}${fileExtension}`;
  
  return await uploadFileToFirebase(file, STORAGE_CONFIG.productImagesPath, customFilename);
};

/**
 * Upload multiple product images
 * @param {string} productId - ID của sản phẩm  
 * @param {File[]} files - Array of file objects
 * @returns {Promise<{success: boolean, uploadedFiles: Array, errors: Array, message: string}>}
 */
export const uploadProductImages = async (productId, files) => {
  const uploadedFiles = [];
  const errors = [];
  
  console.log(`🖼️ Uploading ${files.length} images for product ${productId}`);
  
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const timestamp = Date.now();
      const fileExtension = path.extname(file.name).toLowerCase();
      const customFilename = `product_${productId}_${timestamp}_${i}_${uuidv4()}${fileExtension}`;
      
      const result = await uploadFileToFirebase(file, STORAGE_CONFIG.productImagesPath, customFilename);
      
      if (result.success) {
        uploadedFiles.push({
          filename: result.filename,
          url: result.url,
          path: result.path
        });
        console.log(`✅ File ${i + 1}/${files.length} uploaded: ${result.filename}`);
      } else {
        errors.push(`File ${i + 1}: ${result.message}`);
        console.error(`❌ File ${i + 1} failed:`, result.message);
      }
      
    } catch (error) {
      const errorMsg = `File ${i + 1}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ File ${i + 1} error:`, error);
    }
  }
  
  const success = uploadedFiles.length > 0;
  const message = success 
    ? `${uploadedFiles.length} file(s) uploaded successfully${errors.length > 0 ? `. Errors: ${errors.join('; ')}` : ''}`
    : `Upload failed. Errors: ${errors.join('; ')}`;
  
  return {
    success,
    uploadedFiles,
    errors,
    message
  };
};

/**
 * Delete file from Firebase Storage
 * @param {string} filePath - Đường dẫn file trong Firebase Storage
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteFileFromFirebase = async (filePath) => {
  try {
    console.log(`🗑️ Deleting file: ${filePath}`);
    
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    console.log('✅ File deleted successfully');
    return {
      success: true,
      message: 'File deleted successfully'
    };
    
  } catch (error) {
    console.error('❌ Delete file error:', error);
    return {
      success: false,
      message: `Delete failed: ${error.message}`
    };
  }
};

/**
 * Delete product image by filename
 * @param {string} filename - Tên file cần xóa
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteProductImage = async (filename) => {
  const filePath = `${STORAGE_CONFIG.productImagesPath}${filename}`;
  return await deleteFileFromFirebase(filePath);
};

/**
 * List all files in a folder
 * @param {string} folderPath - Đường dẫn thư mục
 * @returns {Promise<{success: boolean, files: Array, message: string}>}
 */
export const listFilesInFolder = async (folderPath) => {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url: url
        };
      })
    );
    
    return {
      success: true,
      files,
      message: `Found ${files.length} files`
    };
    
  } catch (error) {
    console.error('❌ List files error:', error);
    return {
      success: false,
      files: [],
      message: `List files failed: ${error.message}`
    };
  }
};