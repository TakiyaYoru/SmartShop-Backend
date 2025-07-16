import { uploadReviewImages, deleteReviewImages } from '../services/reviewImageService.js';
import path from 'path';

// Validate image file
const validateImageFile = (filename, allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp']) => {
  if (!filename) {
    throw new Error("Filename is required");
  }
  
  const fileExtension = path.extname(filename).toLowerCase();
  
  if (!fileExtension) {
    throw new Error("File must have an extension");
  }
  
  if (!allowedTypes.includes(fileExtension)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return true;
};

export const typeDef = `
  scalar File

  type ReviewUploadResult {
    success: Boolean!
    message: String!
    urls: [String!]
    filenames: [String!]
  }

  extend type Mutation {
    uploadReviewImages(files: [File!]!): ReviewUploadResult!
    deleteReviewImages(filenames: [String!]!): Boolean!
  }
`;

export const resolvers = {
  Mutation: {
    // Upload review images
    uploadReviewImages: async (_, { files }, context) => {
      try {
        console.log('=== UPLOAD REVIEW IMAGES START ===');
        console.log('Files count:', files.length);
        
        // Validate all files first
        files.forEach(file => validateImageFile(file.name));
        
        // Upload to Firebase
        const uploadResult = await uploadReviewImages(files);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message);
        }
        
        // Extract URLs and filenames
        const urls = uploadResult.uploadedFiles.map(file => file.url);
        const filenames = uploadResult.uploadedFiles.map(file => file.filename);
        
        console.log('✅ Review images uploaded successfully');
        console.log('📊 Upload summary:', {
          successful: uploadResult.uploadedFiles.length,
          failed: uploadResult.errors.length,
          urls: urls
        });
        console.log('=== UPLOAD REVIEW IMAGES END ===');
        
        return {
          success: true,
          message: uploadResult.message,
          urls: urls,
          filenames: filenames
        };
        
      } catch (error) {
        console.error("❌ Upload review images error:", error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          urls: [],
          filenames: []
        };
      }
    },

    // Delete review images
    deleteReviewImages: async (_, { filenames }, context) => {
      try {
        console.log('🗑️ Deleting review images:', filenames);
        
        const result = await deleteReviewImages(filenames);
        
        if (!result.success) {
          throw new Error(result.message);
        }
        
        console.log('✅ Review images deleted successfully');
        return true;
        
      } catch (error) {
        console.error("❌ Delete review images error:", error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    },
  }
}; 