/*
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const typeDef = `
  scalar File

  extend type Mutation {
    upload(file: File!): String!
  }
`;

export const resolvers = {
  Mutation: {
    upload: async (_, { file }) => {
      try {
        const fileArrayBuffer = await file.arrayBuffer();
        
        // Tạo tên file unique với UUID
        const originalName = file.name;
        const fileExtension = path.extname(originalName);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        
        await fs.promises.writeFile(
          path.join(__dirname + "/../img/", uniqueFilename),
          Buffer.from(fileArrayBuffer)
        );
        
        return uniqueFilename; // trả về tên file đã tạo
      } catch (e) {
        console.log("Cannot save uploaded file, reason: " + e);
        return false;
      }
    },
  },
}; */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    // Original upload mutation (keep for compatibility)
    upload: async (_, { file }) => {
      try {
        const fileArrayBuffer = await file.arrayBuffer();
        
        // Tạo tên file unique với UUID
        const originalName = file.name;
        const fileExtension = path.extname(originalName);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        
        await fs.promises.writeFile(
          path.join(__dirname + "/../img/", uniqueFilename),
          Buffer.from(fileArrayBuffer)
        );
        
        return uniqueFilename;
      } catch (e) {
        console.log("Cannot save uploaded file, reason: " + e);
        throw new Error(`Upload failed: ${e.message}`);
      }
    },

    // Upload single image for product
    uploadProductImage: async (_, { productId, file }, context) => {
      try {
        console.log('=== UPLOAD PRODUCT IMAGE START ===');
        console.log('Product ID:', productId);
        
        // Check if product exists
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new Error("Product not found");
        }

        const fileArrayBuffer = await file.arrayBuffer();
        const originalName = file.name;
        
        // Validate image
        validateImageFile(originalName);
        
        const fileExtension = path.extname(originalName);
        const uniqueFilename = `product_${productId}_${Date.now()}_${uuidv4()}${fileExtension}`;
        
        // Save file
        const uploadDir = path.join(__dirname, "../img/");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        await fs.promises.writeFile(
          path.join(uploadDir, uniqueFilename),
          Buffer.from(fileArrayBuffer)
        );
        
        // Update product with new image
        const currentImages = product.images || [];
        const updatedImages = [...currentImages, uniqueFilename];
        
        await context.db.products.updateById(productId, {
          images: updatedImages
        });
        
        const fileUrl = `/img/${uniqueFilename}`;
        
        console.log('Product image uploaded successfully:', fileUrl);
        console.log('=== UPLOAD PRODUCT IMAGE END ===');
        
        return {
          success: true,
          message: "Image uploaded and added to product successfully",
          filename: uniqueFilename,
          url: fileUrl
        };
        
      } catch (error) {
        console.error("Upload product image error:", error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          filename: null,
          url: null
        };
      }
    },

    // Upload multiple images for product
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

        const uploadedFilenames = [];
        const errors = [];
        
        // Create upload directory if it doesn't exist
        const uploadDir = path.join(__dirname, "../img/");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
          try {
            const file = files[i];
            const fileArrayBuffer = await file.arrayBuffer();
            const originalName = file.name;
            
            console.log(`Processing file ${i + 1}/${files.length}: ${originalName}`);
            
            // Validate image
            validateImageFile(originalName);
            
            const fileExtension = path.extname(originalName);
            const uniqueFilename = `product_${productId}_${Date.now()}_${i}_${uuidv4()}${fileExtension}`;
            
            // Save file
            await fs.promises.writeFile(
              path.join(uploadDir, uniqueFilename),
              Buffer.from(fileArrayBuffer)
            );
            
            uploadedFilenames.push(uniqueFilename);
            console.log(`File ${i + 1} uploaded: ${uniqueFilename}`);
            
          } catch (fileError) {
            console.error(`Error uploading file ${i + 1}:`, fileError);
            errors.push(`File ${i + 1}: ${fileError.message}`);
          }
        }
        
        if (uploadedFilenames.length === 0) {
          throw new Error(`No files uploaded successfully. Errors: ${errors.join('; ')}`);
        }
        
        // Update product with new images
        const currentImages = product.images || [];
        const updatedImages = [...currentImages, ...uploadedFilenames];
        
        await context.db.products.updateById(productId, {
          images: updatedImages
        });
        
        const message = errors.length > 0 
          ? `${uploadedFilenames.length} file(s) uploaded successfully. Some files failed: ${errors.join('; ')}`
          : `${uploadedFilenames.length} file(s) uploaded successfully for product`;
        
        console.log('Product images upload completed:', message);
        console.log('=== UPLOAD PRODUCT IMAGES END ===');
        
        return {
          success: true,
          message: message,
          filename: uploadedFilenames.join(", "),
          url: `/img/${uploadedFilenames[0]}`
        };
        
      } catch (error) {
        console.error("Upload product images error:", error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          filename: null,
          url: null
        };
      }
    },

    // Remove image from product
    removeProductImage: async (_, { productId, filename }, context) => {
      try {
        console.log('=== REMOVE PRODUCT IMAGE START ===');
        console.log('Product ID:', productId, 'Filename:', filename);
        
        // Check if product exists
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new Error("Product not found");
        }
        
        const currentImages = product.images || [];
        
        // Check if image exists in product
        if (!currentImages.includes(filename)) {
          throw new Error("Image not found in product");
        }
        
        // Remove image from product
        const updatedImages = currentImages.filter(img => img !== filename);
        
        await context.db.products.updateById(productId, {
          images: updatedImages
        });
        
        // Try to delete physical file (optional - don't fail if file doesn't exist)
        try {
          const filePath = path.join(__dirname, "../img/", filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Physical file deleted:', filename);
          }
        } catch (deleteError) {
          console.warn('Could not delete physical file:', deleteError.message);
        }
        
        console.log('Image removed from product successfully');
        console.log('=== REMOVE PRODUCT IMAGE END ===');
        
        return true;
        
      } catch (error) {
        console.error("Remove product image error:", error);
        throw new Error(`Remove image failed: ${error.message}`);
      }
    }
  },
};