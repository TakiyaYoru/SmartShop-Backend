// server/graphql/upload.js - Updated với Firebase Storage (FIXED)
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { 
  uploadFileToFirebase,
  uploadProductImage,
  uploadProductImages,
  deleteProductImage
} from "../services/firebaseStorageService.js";

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

  type UploadResult {
    success: Boolean!
    message: String!
    filename: String
    url: String
  }

  extend type Mutation {
    upload(file: File!): String!
    uploadProductImage(productId: ID!, file: File!): UploadResult!
    uploadProductImages(productId: ID!, files: [File!]!): UploadResult!
    removeProductImage(productId: ID!, filename: String!): Boolean!
  }
`;

export const resolvers = {
  Mutation: {
    // ✅ UPDATED: Basic upload với Firebase
    upload: async (_, { file }) => {
      try {
        console.log('📤 Basic upload starting...');
        
        // Validate image
        validateImageFile(file.name);
        
        // Upload to Firebase
        const result = await uploadFileToFirebase(file);
        
        if (!result.success) {
          throw new Error(result.message);
        }
        
        console.log('✅ Basic upload successful:', result.filename);
        return result.filename;
        
      } catch (error) {
        console.error("❌ Basic upload error:", error);
        throw new Error(`Upload failed: ${error.message}`);
      }
    },

    // ✅ FIXED: Upload single product image với Firebase
    uploadProductImage: async (_, { productId, file }, context) => {
      try {
        console.log('=== UPLOAD PRODUCT IMAGE START ===');
        console.log('Product ID:', productId);
        
        // Check if product exists
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new Error("Product not found");
        }

        // Validate image
        validateImageFile(file.name);
        
        // Upload to Firebase
        const uploadResult = await uploadProductImage(productId, file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message);
        }
        
        // ✅ FIXED: Update product với Firebase URL (không phải filename)
        const currentImages = product.images || [];
        const updatedImages = [...currentImages, uploadResult.url]; // ✅ LƯU URL

        await context.db.products.updateById(productId, {
          images: updatedImages
        });
        
        console.log('✅ Product image uploaded successfully');
        console.log('🔗 Firebase URL:', uploadResult.url);
        console.log('📁 Saved to DB:', uploadResult.url);
        console.log('=== UPLOAD PRODUCT IMAGE END ===');
        
        return {
          success: true,
          message: "Image uploaded to Firebase and added to product successfully",
          filename: uploadResult.filename,
          url: uploadResult.url
        };
        
      } catch (error) {
        console.error("❌ Upload product image error:", error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          filename: null,
          url: null
        };
      }
    },

    // ✅ FIXED: Upload multiple product images với Firebase
    uploadProductImages: async (_, { productId, files }, context) => {
      try {
        console.log('=== UPLOAD PRODUCT IMAGES START ===');
        console.log('Product ID:', productId);
        console.log('Files count:', files.length);
        
        // Check if product exists
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new Error("Product not found");
        }
        
        // Validate all files first
        files.forEach(file => validateImageFile(file.name));
        
        // Upload to Firebase
        const uploadResult = await uploadProductImages(productId, files);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message);
        }
        
        // ✅ FIXED: Get URLs from successful uploads (không phải filename)
        const uploadedUrls = uploadResult.uploadedFiles.map(file => file.url); // ✅ LẤY URLs
        
        // ✅ FIXED: Update product với Firebase URLs
        const currentImages = product.images || [];
        const updatedImages = [...currentImages, ...uploadedUrls]; // ✅ LƯU URLs
        
        await context.db.products.updateById(productId, {
          images: updatedImages
        });
        
        // Prepare response
        const allUrls = uploadResult.uploadedFiles.map(file => file.url);
        const allFilenames = uploadResult.uploadedFiles.map(file => file.filename);
        const mainUrl = allUrls.length > 0 ? allUrls[0] : null;
        
        console.log('✅ Multiple images uploaded successfully');
        console.log('📊 Upload summary:', {
          successful: uploadResult.uploadedFiles.length,
          failed: uploadResult.errors.length,
          mainUrl: mainUrl
        });
        console.log('📁 Saved URLs to DB:', uploadedUrls);
        console.log('=== UPLOAD PRODUCT IMAGES END ===');
        
        return {
          success: true,
          message: uploadResult.message,
          filename: allFilenames.join(', '), // Tương thích với frontend
          url: mainUrl // URL của ảnh đầu tiên
        };
        
      } catch (error) {
        console.error("❌ Upload product images error:", error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          filename: null,
          url: null
        };
      }
    },

    // ✅ UPDATED: Remove product image từ Firebase
    removeProductImage: async (_, { productId, filename }, context) => {
      try {
        console.log('🗑️ Removing product image:', filename);
        
        // Check if product exists
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new Error("Product not found");
        }
        
        // ✅ IMPROVED: Handle both URL and filename for removal
        let imageToRemove = filename;
        
        // If it's a URL, extract filename for Firebase deletion
        if (filename.includes('firebasestorage.googleapis.com')) {
          const urlParts = filename.split('/');
          const encodedFilename = urlParts[urlParts.length - 1].split('?')[0];
          imageToRemove = decodeURIComponent(encodedFilename);
          console.log('🔍 Extracted filename from URL:', imageToRemove);
        }
        
        // Remove from Firebase Storage
        const deleteResult = await deleteProductImage(imageToRemove);
        
        if (!deleteResult.success) {
          console.warn('⚠️ Firebase delete failed:', deleteResult.message);
          // Vẫn tiếp tục remove khỏi database
        }
        
        // ✅ IMPROVED: Remove from product images array (support both URL and filename)
        const currentImages = product.images || [];
        const updatedImages = currentImages.filter(img => 
          img !== filename && // Remove exact match
          img !== imageToRemove && // Remove filename match
          !img.includes(imageToRemove) // Remove URL containing filename
        );
        
        await context.db.products.updateById(productId, {
          images: updatedImages
        });
        
        console.log('✅ Product image removed successfully');
        console.log('📁 Removed from DB:', filename);
        return true;
        
      } catch (error) {
        console.error("❌ Remove product image error:", error);
        throw new Error(`Remove failed: ${error.message}`);
      }
    }
  }
};